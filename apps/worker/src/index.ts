import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { leaderboardRoutes } from './routes/leaderboard';
import { scenariosRoutes } from './routes/scenarios';
import { userRoutes } from './routes/user';
import { multiplayerRoutes } from './routes/multiplayer';
import { Env } from './worker-env';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('/api/*', (c, next) => {
  return cors({
    origin: [c.env.VITE_URL, 'http://localhost:5173'],
    credentials: true,
  })(c, next);
});

const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/game', gameRoutes)
  .route('/api/leaderboard', leaderboardRoutes)
  .route('/api/scenarios', scenariosRoutes)
  .route('/api/user', userRoutes)
  .route('/api/multiplayer', multiplayerRoutes);

export type AppType = typeof routes;

export { MultiplayerSession } from './durable_objects/MultiplayerSession';

import { queueHandler } from './jobs/queue';
import { scheduledHandler } from './jobs/cron';

export default {
  fetch: app.fetch,
  queue: queueHandler,
  scheduled: scheduledHandler
};
