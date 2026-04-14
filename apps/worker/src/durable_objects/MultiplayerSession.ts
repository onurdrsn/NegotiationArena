import { DurableObject } from 'cloudflare:workers';

interface Player {
  id: string;
  ws: WebSocket;
  modeId: string;
}

export class MultiplayerSession extends DurableObject {
  waitingPlayers: Player[] = [];
  rooms: Map<string, Player[]> = new Map();

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const url = new URL(request.url);
    const modeId = url.searchParams.get('modeId') || 'random';
    const userId = url.searchParams.get('userId') || crypto.randomUUID();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    
    const newPlayer: Player = { id: userId, ws: server, modeId };

    // Matchmaking logic
    const opponentIndex = this.waitingPlayers.findIndex(p => p.modeId === modeId && p.id !== userId);

    if (opponentIndex !== -1) {
      // Found a match
      const opponent = this.waitingPlayers.splice(opponentIndex, 1)[0];
      const roomId = crypto.randomUUID();
      
      this.rooms.set(roomId, [opponent, newPlayer]);
      
      const matchFoundMsg = JSON.stringify({
        type: 'MATCH_FOUND',
        roomId,
        message: 'Rakip bulundu! Müzakere başlıyor...'
      });

      opponent.ws.send(matchFoundMsg);
      server.send(matchFoundMsg);
    } else {
      // Add to waiting queue
      this.waitingPlayers.push(newPlayer);
      server.send(JSON.stringify({ type: 'WAITING', message: 'Eşleşme bekleniyor...' }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Broadcast message to the other player in the room
    const data = JSON.parse(message as string);
    const { roomId, content } = data;

    if (roomId && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      for (const p of room) {
        if (p.ws !== ws) {
          p.ws.send(JSON.stringify({ type: 'CHAT', content }));
        }
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.waitingPlayers = this.waitingPlayers.filter(p => p.ws !== ws);

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.some(p => p.ws === ws)) {
        // notify the other player
        for (const p of room) {
          if (p.ws !== ws) {
            p.ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
            // We should maybe keep their session or close it
            p.ws.close();
          }
        }
        this.rooms.delete(roomId);
        break;
      }
    }
  }
}
