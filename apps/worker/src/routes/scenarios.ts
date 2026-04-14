import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../db/client';
import { customScenarios, users } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../worker-env';
import type { ZodSchema } from 'zod';

const scenarios = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

const validate = <T extends ZodSchema>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue?.message ?? 'Geçersiz istek';
      return c.json({ error: message }, 400);
    }
  });

// Public community scenarios
scenarios.get('/community', async (c) => {
  const db = getDb(c.env.NEON_DATABASE_URL);
  
  // Sort by play count for trending/top
  const list = await db.select({
    id: customScenarios.id,
    title: customScenarios.title,
    subtitle: customScenarios.subtitle,
    icon: customScenarios.icon,
    authorName: users.displayName,
    playCount: customScenarios.playCount,
    likeCount: customScenarios.likeCount
  })
  .from(customScenarios)
  .leftJoin(users, eq(customScenarios.authorId, users.id))
  .where(eq(customScenarios.isPublished, true))
  .orderBy(desc(customScenarios.playCount))
  .limit(50);

  return c.json(list);
});

// Single scenario
scenarios.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.NEON_DATABASE_URL);
  const [data] = await db.select().from(customScenarios).where(eq(customScenarios.id, id));
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json(data);
});

scenarios.use('*', authMiddleware);

const CreateScenarioSchema = z.object({
  title: z.string().min(5).max(100),
  subtitle: z.string().min(10).max(1000),
  icon: z.string().emoji(),
  characterName: z.string().min(2).max(50),
  characterTitle: z.string().min(2).max(100),
  systemPrompt: z.string().min(20).max(3000)
});

scenarios.post('/', validate(CreateScenarioSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [inserted] = await db.insert(customScenarios).values({
    authorId: userId,
    title: data.title,
    subtitle: data.subtitle,
    icon: data.icon,
    characterName: data.characterName,
    characterTitle: data.characterTitle,
    systemPrompt: data.systemPrompt,
    isPublished: false
  }).returning();

  return c.json(inserted);
});

scenarios.post('/:id/publish', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [scenario] = await db.select().from(customScenarios).where(and(
    eq(customScenarios.id, id),
    eq(customScenarios.authorId, userId)
  ));

  if (!scenario) return c.json({ error: 'Unauthorized or not found' }, 403);
  if (scenario.isPublished) return c.json({ error: 'Already published' }, 400);

  // AI Moderation check
  const modPrompt = `Analyze the following system prompt for a negotiation game bot. Does it contain harmful, explicit, deeply offensive, or illegal content? Answer exactly YES or NO.
Prompt: ${scenario.systemPrompt}`;

  const res = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: modPrompt }]
  });

  if (res.response.includes('YES')) {
    return c.json({ error: 'Senaryo AI moderasyonundan geçemedi. İçeriğiniz zararlı veya uygunsuz bulundu.' }, 400);
  }

  // Publish
  await db.update(customScenarios).set({ isPublished: true }).where(eq(customScenarios.id, id));

  // Notification part (Mocked for now, assumes Resend API usage)
  // fetch users where emailNotificationsEnabled=true
  // and send email about new community scenario
  
  return c.json({ success: true, message: 'Senaryo yayımlandı!' });
});

export const scenariosRoutes = scenarios;
