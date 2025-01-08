import { WebSocket, type RawData, type WebSocketServer } from 'ws';

import getTokensWS from './controllers/getTokensWS';
import sendLatestTokensWS from './controllers/sendLatestTokensWS';

import type { Token } from '@/utils/types/external';
import type { WsMessage } from '..';

export default async function handleMessage(
  ws: WebSocket,
  wss: WebSocketServer,
  data: RawData
) {
  try {
    const message: WsMessage<Token[]> = JSON.parse(data.toString());
    switch (message.method) {
      case 'latestTokens':
        sendLatestTokensWS(ws, wss, message.payload);
        break;
      case 'getTokens':
        getTokensWS(ws, wss);
        break;
      default:
        ws.send(
          JSON.stringify({ type: 'error', payload: 'Invalid message type' })
        );
        break;
    }
  } catch (e: any) {
    console.log(`Invalid message format received: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Invalid message format',
      })
    );
  }
}
