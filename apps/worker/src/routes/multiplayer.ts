import { Hono } from 'hono';
import { Env } from '../worker-env';
import { authMiddleware } from '../middleware/auth';

const mp = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

mp.use('*', authMiddleware);

mp.get('/connect', async (c) => {
  const userId = c.get('userId');
  const modeId = c.req.query('modeId') || 'random';

  // Yalnızca tek bir global eşleştirici (matchmaker) objesi ayakta kalacak
  const id = c.env.MULTIPLAYER.idFromName("GLOBAL_MATCHMAKER");
  const stub = c.env.MULTIPLAYER.get(id);

  const url = new URL(c.req.url);
  url.searchParams.set('userId', userId);
  url.searchParams.set('modeId', modeId);

  // Gelen isteği tamamen WebSocket headers vs. ile beraber DO'ya iletiyoruz
  const req = new Request(url.toString(), c.req.raw);
  return stub.fetch(req);
});

export const multiplayerRoutes = mp;
