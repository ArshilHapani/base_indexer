import WebSocket, { type WebSocketServer } from 'ws';
import type { IncomingMessage, Server } from 'http';

import setupHandlers from './handlers/connection';
import { getLatestTokens } from '@/utils/helpers';
import { sendedTokens } from './state';

export default function initWebSocket(server: Server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', async function (ws, req) {
    // TODO setup subscription based on the request
    console.log('Connected');
    setupHandlers(ws, wss);
    const latestTokens = await getLatestTokens();
    sendedTokens.set(
      ws,
      new Set(latestTokens.map((token) => token.address ?? token.name))
    );
    ws.send(
      JSON.stringify({
        type: 'latestTokens',
        payload: latestTokens,
      })
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

export type WsMessage<T = any> = {
  method: 'getTokens' | 'latestTokens';
  payload: T;
  type: 'subscribe' | 'unsubscribe' | 'call';
};

export interface WsContext {
  ws: WebSocket;
  wss: WebSocketServer;
  req: IncomingMessage;
}

export type WsHandler = (context: WsContext, message?: WsMessage) => void;
