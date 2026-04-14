import type { GameSession } from '@arena/shared';
// @ts-ignore
export async function getGameSession(kv: KVNamespace, sessionId: string): Promise<GameSession | null> {
  const data = await kv.get(`game:session:${sessionId}`, 'json');
  return data as GameSession | null;
}

export async function saveGameSession(kv: KVNamespace, session: GameSession): Promise<void> {
  await kv.put(`game:session:${session.sessionId}`, JSON.stringify(session), { expirationTtl: 3600 });
}

export async function deleteGameSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`game:session:${sessionId}`);
}
