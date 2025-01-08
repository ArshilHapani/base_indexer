import { WebSocketServer } from 'ws';
import type { WsMessage } from '..';

export function broadcast(wss: WebSocketServer, message: WsMessage): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
