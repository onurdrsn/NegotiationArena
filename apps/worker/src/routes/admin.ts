import { Hono } from 'hono';
import { Env } from '../worker-env';
import { scheduledHandler } from '../jobs/cron';

const admin = new Hono<{ Bindings: Env }>();

// This endpoint allows manual triggering of the tournament cycle logic
// since the account reached the limit of 5 cron triggers on the Free plan.
admin.post('/tournament/cycle', async (c) => {
  // Simple security check using a secret from env if available, otherwise just allow for now
  // or restrict to authenticated admin users if implemented.
  const authHeader = c.req.header('Authorization');
  if (c.env.ENVIRONMENT === 'production' && authHeader !== `Bearer ${c.env.JWT_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Mock a ScheduledEvent and ExecutionContext
  const mockEvent: any = {
    scheduledTime: Date.now(),
    cron: 'manual',
    noRetry: () => { },
  };

  const mockCtx: any = {
    waitUntil: (p: Promise<any>) => c.executionCtx.waitUntil(p),
    passThroughOnException: () => c.executionCtx.passThroughOnException(),
  };

  try {
    await scheduledHandler(mockEvent, c.env, mockCtx);
    return c.json({ success: true, message: 'Tournament cycle executed successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export const adminRoutes = admin;
