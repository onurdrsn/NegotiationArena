import { Hono } from 'hono';
import { getDb } from '../db/client';
import { leaderboard, users } from '../db/schema';
import { desc, eq, gt } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../worker-env';

const lb = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

lb.use('/me', authMiddleware);

lb.get('/global', async (c) => {
  const kv = c.env.NEGOTIATION_ARENA_KV;
  const cached = await kv.get('leaderboard:global', 'json');
  if (cached) return c.json(cached);

  const db = getDb(c.env.NEON_DATABASE_URL);
  const data = await db.select({
    userId: users.id,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    totalScore: users.totalScore,
    gamesPlayed: users.gamesPlayed
  }).from(users).where(gt(users.gamesPlayed, 0)).orderBy(desc(users.totalScore)).limit(100);

  const mapped = data.map((u, i) => ({ rank: i + 1, ...u }));
  await kv.put('leaderboard:global', JSON.stringify(mapped), { expirationTtl: 300 });

  return c.json(mapped);
});

lb.get('/mode/:modeId', async (c) => {
  const modeId = c.req.param('modeId');
  const kv = c.env.NEGOTIATION_ARENA_KV;
  const cached = await kv.get(`leaderboard:mode:${modeId}`, 'json');
  if (cached) return c.json(cached);

  const db = getDb(c.env.NEON_DATABASE_URL);
  const data = await db.select().from(leaderboard)
    .where(eq(leaderboard.modeId, modeId))
    .orderBy(desc(leaderboard.bestScore))
    .limit(100);

  await kv.put(`leaderboard:mode:${modeId}`, JSON.stringify(data), { expirationTtl: 300 });
  return c.json(data);
});

lb.get('/me', async (c) => {
  const userId = c.get('userId');
  const db = getDb(c.env.NEON_DATABASE_URL);
  const [data] = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    email: users.email,
    totalScore: users.totalScore,
    gamesPlayed: users.gamesPlayed,
    googleId: users.googleId,
    isEmailVerified: users.isEmailVerified,
    emailNotificationsEnabled: users.emailNotificationsEnabled,
    avatarUrl: users.avatarUrl
  }).from(users).where(eq(users.id, userId));
  return c.json({ user: data || null });
});

export const leaderboardRoutes = lb;
