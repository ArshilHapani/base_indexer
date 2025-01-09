import { WebSocket, type RawData, type WebSocketServer } from 'ws';

import type { Token } from '@/utils/types/external';
import {
  createChannel,
  publishToChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
} from '../utils/channels';
import { handleLatestTokensChannel } from './controllers/handleInitialChannelConnection';
import type { WsMessage } from '..';

type WsMessagePayload = Token[] | undefined;

export default async function handleMessage(
  ws: WebSocket,
  wss: WebSocketServer,
  data: RawData
) {
  try {
    const { payload, type, channel }: WsMessage<WsMessagePayload> = JSON.parse(
      data.toString()
    );
    switch (type) {
      case 'createChannel':
        createChannel(channel);
        break;
      case 'publishToChannel':
        publishToChannel<WsMessagePayload>(channel, payload);
        break;
      case 'subscribeToChannel':
        subscribeToChannel(ws, channel);
        if (channel === 'latestTokens') handleLatestTokensChannel(ws); // sending latest tokens on initial connection to the connected client
        break;
      case 'unsubscribeFromChannel':
        unsubscribeFromChannel(ws, channel);
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
