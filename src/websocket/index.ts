import WebSocket, { type WebSocketServer } from 'ws';
import type { IncomingMessage, Server } from 'http';

import setupHandlers from './handlers/connection';
import { influxLogger } from '@/utils/influxDB';

export default function initWebSocket(server: Server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', async function (ws, req) {
    console.log('Connected');
    setupHandlers(ws, wss);
  });

  wss.on('error', async (err) => {
    console.log('Error in WebSocket server', err);
    await influxLogger.writeLog(
      'websocket_error',
      {
        message: `WebSocket error occurred in function 'initWebSocket' in file 'websocket/index.ts': ${err.message}`,
      },
      { level: 'error' }
    );
  });

  console.log(
    `WebSocket server is running on ws://localhost:${process.env.PORT}`
  );
  return wss;
}

//////////////////////////////////////////////////
///////////////////// TYPES /////////////////////
//////////////////////////////////////////////////

export type ChannelTypes =
  | 'latestTokens'
  | 'latestPools'
  | 'trendingPools'
  | 'latestPairs';

export type WsMessage<T = any> = {
  payload: T;
  type:
    | 'createChannel'
    | 'subscribeToChannel'
    | 'unsubscribeFromChannel'
    | 'publishToChannel';
  channel: ChannelTypes;
};

export interface WsContext {
  ws: WebSocket;
  wss: WebSocketServer;
  req: IncomingMessage;
}

export type WsHandler = (context: WsContext, message?: WsMessage) => void;
