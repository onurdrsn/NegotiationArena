import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function rateLimit(key: string, limit: number, kv: KVNamespace) {
  const current = await kv.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    throw new HTTPException(429, { message: 'Rate limit exceeded' });
  }
  
  await kv.put(key, String(count + 1), { expirationTtl: 60 });
}

export const loginRateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  await rateLimit(`ratelimit:${ip}:login`, 5, c.env.NEGOTIATION_ARENA_KV);
  await next();
}

export const registerRateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  await rateLimit(`ratelimit:${ip}:register`, 3, c.env.NEGOTIATION_ARENA_KV as any);
  await next();
}

export const gameRateLimiter = async (c: Context, next: Next) => {
  const userId = c.get('userId');
  if (userId) {
     await rateLimit(`ratelimit:${userId}:game_message`, 30, c.env.NEGOTIATION_ARENA_KV as any);
  }
  await next();
}
