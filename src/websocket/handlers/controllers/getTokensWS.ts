import type { WebSocketServer, WebSocket } from 'ws';

import { tokens } from '@/websocket/state';
import { getLatestTokens } from '@/utils/helpers';

export default async function getTokensWS(ws: WebSocket, wss: WebSocketServer) {
  if (tokens.length > 0) {
    ws.send(
      JSON.stringify({
        type: `Updated tokens`,
        payload: tokens,
      })
    );
  } else {
    const data = await getLatestTokens();
    tokens.push(...data);
    ws.send(
      JSON.stringify({
        type: 'latestTokens',
        payload: tokens,
      })
    );
  }
}
