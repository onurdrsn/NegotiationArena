import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { StartGameSchema, SendMessageSchema } from '@arena/shared';
import type { GameSession } from '@arena/shared';
import { Env } from '../worker-env';
import { SCENARIOS } from '../lib/scenarios';
import { getGameSession, saveGameSession, deleteGameSession } from '../services/session';
import { getCharacterResponse, scoreRound } from '../services/ai';
import { getDb } from '../db/client';
import { gameSessions, roundMessages, users, customScenarios } from '../db/schema';
import { eq } from 'drizzle-orm';
import { calculateFinalScore, getOutcome } from '../services/scoring';
import { authMiddleware } from '../middleware/auth';
import { gameRateLimiter } from '../middleware/rateLimit';

const game = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

game.use('*', authMiddleware);

game.post('/start', zValidator('json', StartGameSchema), async (c) => {
  const data = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);
  
  let scenario: any;
  let character: any;
  let charType = 'custom';

  // 1. Check if it is a custom scenario
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.modeId);
  const customList = isUuid ? await db.select().from(customScenarios).where(eq(customScenarios.id, data.modeId)) : [];
  const custom = customList[0];
  if (custom) {
    scenario = { title: custom.title, subtitle: custom.subtitle, maxRounds: 3 };
    character = { name: custom.characterName, title: custom.characterTitle, systemPrompt: custom.systemPrompt };
    
    // Update play count
    await db.update(customScenarios).set({ playCount: (custom.playCount || 0) + 1 }).where(eq(customScenarios.id, data.modeId));
  } else {
    // 2. Fallback to static scenarios
    scenario = SCENARIOS[data.modeId as keyof typeof SCENARIOS] as any;
    if (!scenario) return c.json({ error: 'Scenario not found' }, 404);
    
    const charKeys = Object.keys(scenario.characters) as any[];
    charType = charKeys[Math.floor(Math.random() * charKeys.length)];
    character = scenario.characters[charType as keyof typeof scenario.characters];
  }
  
  const sessionId = crypto.randomUUID();
  const sessionData: GameSession = {
    sessionId,
    modeId: data.modeId,
    characterType: charType,
    round: 1,
    messages: []
  };

  await saveGameSession(c.env.NEGOTIATION_ARENA_KV, sessionData);

  const openingPrompt = `Sen Negotiation Arena'nın acımasız ve net bir dış sesisin. 
Durum: ${scenario.title} - ${scenario.subtitle}
Saniye işliyor. Karşında ${character.title} rolündeki ${character.name} var.
Karakterin yapısı: ${character.systemPrompt.split('\n')[0].replace('Sen ', 'O bir ')}

Oyuncuya rolünün ne olduğunu ve ne beklediğini çok gerilimli ve baskıcı bir dış ses olarak açıkla. Kesinlikle karakterin yerine (Kemal Bey, Hakan Bey vb. olarak) konuşma. Sen sadece ortamı ve krizi anlatan bir yapay zekasın. (Max 3 cümle).`;

  const openingMessage = await getCharacterResponse(
    c.env,
    openingPrompt,
    [{ role: 'user', content: '[Oyuncuya durumu ve rolünü açıkla, ardından argümanını girmesini iste.]' }]
  );

  return c.json({ sessionId, character, openingMessage });
});

game.post('/message', gameRateLimiter, zValidator('json', SendMessageSchema), async (c) => {
  const { sessionId, message } = c.req.valid('json');

  const session = await getGameSession(c.env.NEGOTIATION_ARENA_KV, sessionId);
  if (!session) return c.json({ error: 'Session not found' }, 404);

  const db = getDb(c.env.NEON_DATABASE_URL);
  
  let scenario: any;
  let character: any;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.modeId);
  const customList = isUuid ? await db.select().from(customScenarios).where(eq(customScenarios.id, session.modeId)) : [];
  const custom = customList[0];
  
  if (custom) {
    scenario = { title: custom.title, subtitle: custom.subtitle, maxRounds: 3 };
    character = { name: custom.characterName, title: custom.characterTitle, systemPrompt: custom.systemPrompt };
  } else {
    scenario = SCENARIOS[session.modeId as keyof typeof SCENARIOS] as any;
    character = scenario.characters[session.characterType];
  }

  const history = session.messages.flatMap(m => [
    { role: 'user' as const, content: m.userMessage },
    { role: 'assistant' as const, content: m.aiResponse }
  ]);
  history.push({ role: 'user' as const, content: message });

  const [aiResponse, evaluation] = await Promise.all([
    getCharacterResponse(c.env, character.systemPrompt, history),
    scoreRound(c.env, message, scenario.subtitle)
  ]);

  const msgData = {
    round: session.round,
    userMessage: message,
    aiResponse: aiResponse,
    roundScore: evaluation.score,
    feedback: evaluation.feedback
  };

  session.messages.push(msgData);
  const isLastRound = session.round >= scenario.maxRounds;
  
  if (!isLastRound) {
    session.round += 1;
    await saveGameSession(c.env.NEGOTIATION_ARENA_KV, session);
  } else {
    await saveGameSession(c.env.NEGOTIATION_ARENA_KV, session); // Keep temporarily if needed before /end
  }

  return c.json({
    aiMessage: aiResponse,
    roundScore: evaluation.score,
    feedback: evaluation.feedback,
    round: msgData.round,
    isLastRound
  });
});

game.post('/end', zValidator('json', SendMessageSchema.pick({ sessionId: true })), async (c) => {
  const { sessionId } = c.req.valid('json');
  const userId = c.get('userId');

  const session = await getGameSession(c.env.NEGOTIATION_ARENA_KV, sessionId);
  if (!session || session.messages.length === 0) return c.json({ error: 'Session invalid' }, 400);

  const roundScores = session.messages.map(m => m.roundScore);
  const finalScore = calculateFinalScore(roundScores);
  const outcome = getOutcome(finalScore);

  const db = getDb(c.env.NEON_DATABASE_URL);
  
  await db.insert(gameSessions).values({
    id: sessionId,
    userId,
    modeId: session.modeId,
    characterType: session.characterType,
    round1Score: roundScores[0],
    round2Score: roundScores[1],
    round3Score: roundScores[2],
    finalScore,
    outcome,
    completedAt: new Date()
  });

  for (const m of session.messages) {
    await db.insert(roundMessages).values({
      sessionId: sessionId,
      round: m.round,
      userMessage: m.userMessage,
      aiResponse: m.aiResponse,
      roundScore: m.roundScore,
      feedback: m.feedback
    });
  }

  // Update user score
  const userList = await db.select().from(users).where(eq(users.id, userId));
  if (userList[0]) {
    await db.update(users).set({
      totalScore: (userList[0].totalScore || 0) + finalScore,
      gamesPlayed: (userList[0].gamesPlayed || 0) + 1
    }).where(eq(users.id, userId));
  }

  // Send async job to Queue for tournament scoring, badges, and R2 replay storing
  try {
    await c.env.SCORE_QUEUE.send({
      userId,
      sessionId,
      modeId: session.modeId,
      finalScore,
      outcome,
      replayData: session.messages
    });
  } catch (err) {
    console.error('Queue error:', err);
  }

  await deleteGameSession(c.env.NEGOTIATION_ARENA_KV, sessionId);

  return c.json({
    finalScore,
    outcome,
    roundScores,
    characterFeedback: "Oyun tamamlandı."
  });
});

export const gameRoutes = game;
