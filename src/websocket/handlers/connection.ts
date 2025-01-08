import type { RawData, WebSocket, WebSocketServer } from 'ws';

import handleMessage from './message';
import handleClose from './close';

export default function setupHandlers(ws: WebSocket, wss: WebSocketServer) {
  ws.on('message', (data: RawData) => {
    handleMessage(ws, wss, data);
  });
  ws.on('close', () => {
    handleClose(ws, wss);
  });
}
