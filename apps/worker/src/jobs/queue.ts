import { Env } from '../worker-env';
import { getDb } from '../db/client';
import { tournaments, tournamentScores, userBadges, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface ScorePayload {
  userId: string;
  sessionId: string;
  modeId: string;
  finalScore: number;
  outcome: string;
  replayData: any; // Entire chat history
}

export const queueHandler = async (batch: MessageBatch<ScorePayload>, env: Env, ctx: ExecutionContext) => {
  const db = getDb(env.NEON_DATABASE_URL);
  const [activeTournament] = await db.select().from(tournaments).where(eq(tournaments.status, 'active'));

  for (const message of batch.messages) {
    const payload = message.body;

    // 1. Export replay to R2 Bucket
    try {
      const fileName = `replays/${payload.userId}/${payload.sessionId}.json`;
      await env.STORAGE.put(fileName, JSON.stringify(payload.replayData, null, 2), {
        httpMetadata: { contentType: 'application/json' }
      });
    } catch (err) {
      console.error("R2 Upload Error", err);
    }

    // 2. Active Tournament Scoring update
    if (activeTournament) {
      const existingScore = await db.select()
        .from(tournamentScores)
        .where(
          and(
            eq(tournamentScores.tournamentId, activeTournament.id),
            eq(tournamentScores.userId, payload.userId)
          )
        );

      if (existingScore.length > 0) {
        await db.update(tournamentScores)
          .set({
            weeklyScore: (existingScore[0].weeklyScore || 0) + payload.finalScore,
            gamesThisWeek: (existingScore[0].gamesThisWeek || 0) + 1,
            updatedAt: new Date()
          })
          .where(eq(tournamentScores.id, existingScore[0].id));
      } else {
        await db.insert(tournamentScores).values({
          tournamentId: activeTournament.id,
          userId: payload.userId,
          weeklyScore: payload.finalScore,
          gamesThisWeek: 1
        });
      }
    }

    // 3. BADGES Logic
    if (payload.finalScore > 90) {
      // Award 'Perfectionist' badge assuming ID is 'perf'
      // Try to insert, ignore if already exists (Neon postgres doesn't support insert ON CONFLiCT DO NOTHING natively in drizzle easily without raw SQL unless unique constraint. We'll just catch duplicates)
      try {
        await db.insert(userBadges).values({
          userId: payload.userId,
          badgeId: 'perf', // Must exist in badges table
        });
        
        // Emulate sending an email notification to user about earning a badge
        const u = await db.select().from(users).where(eq(users.id, payload.userId));
        if (u[0] && u[0].emailNotificationsEnabled) {
          // sendEmail(u[0].email, "Yeni bir rozet kazandınız!");
        }

      } catch (err) {
        // Already earned badge
      }
    }
  }
};
