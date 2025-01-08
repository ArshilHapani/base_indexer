import type { WebSocket, WebSocketServer } from 'ws';

export default function handleClose(ws: WebSocket, wss: WebSocketServer) {
  ws.close();
  console.log('Client disconnected');
}
