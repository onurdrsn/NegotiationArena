import { sign, verify } from 'hono/jwt';

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  displayName: string;
  iat: number;
  exp: number;       // expiration
}

export async function createSessionToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days
  return await sign({ ...payload, iat, exp }, secret, 'HS256');
}

export async function verifySessionToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const decoded = await verify(token, secret, 'HS256');
    return decoded as unknown as JWTPayload;
  } catch {
    return null;
  }
}
