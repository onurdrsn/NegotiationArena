import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../worker-env';

const user = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

user.use('*', authMiddleware);

user.patch('/settings', zValidator('json', z.object({
  emailNotificationsEnabled: z.boolean().optional(),
})), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const db = getDb(c.env.NEON_DATABASE_URL);
  
  await db.update(users)
    .set({
      ...(data.emailNotificationsEnabled !== undefined && { emailNotificationsEnabled: data.emailNotificationsEnabled })
    })
    .where(eq(users.id, userId));

  return c.json({ success: true });
});

export const userRoutes = user;
