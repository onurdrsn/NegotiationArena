import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifySessionToken } from '../lib/jwt';
import { HTTPException } from 'hono/http-exception';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    email: string;
    displayName: string;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const token = getCookie(c, 'session');
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const payload = await verifySessionToken(token, c.env.JWT_SECRET);
  if (!payload) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  c.set('userId', payload.sub);
  c.set('email', payload.email);
  c.set('displayName', payload.displayName);
  
  await next();
}
