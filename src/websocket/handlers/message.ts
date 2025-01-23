import { WebSocket, type RawData, type WebSocketServer } from 'ws';

import type { Token } from '@/utils/types/external';
import {
  createChannel,
  publishToChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
} from '../utils/channels';
import {
  handleLatestPairChannel,
  handleLatestPoolChannel,
  handleLatestTokensChannel,
  handleTrendingPoolsChannel,
} from './controllers/handleInitialChannelConnection';
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

        // handling initial connection (sending the latest data)
        switch (channel) {
          case 'latestTokens':
            handleLatestTokensChannel(ws);
            break;
          case 'latestPools':
            handleLatestPoolChannel(ws);
            break;
          case 'trendingPools':
            handleTrendingPoolsChannel(ws);
            break;
          case 'latestPairs':
            handleLatestPairChannel(ws);
            break;
        }

        break;
      case 'unsubscribeFromChannel':
        unsubscribeFromChannel(ws, channel);
        break;
      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            payload:
              'Invalid message format, available message types: "createChannel", "publishToChannel", "subscribeToChannel", "unsubscribeFromChannel"',
          })
        );
        break;
    }
  } catch (e: any) {
    console.log(`Invalid message format received: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload:
          'Invalid message format, available message types: createChannel, publishToChannel, subscribeToChannel, unsubscribeFromChannel' +
          e.message,
      })
    );
  }
}
