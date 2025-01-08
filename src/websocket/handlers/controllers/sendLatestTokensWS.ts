import type { Token } from '@/utils/types/external';
import { sendedTokens } from '@/websocket/state';
import type { WebSocket, WebSocketServer } from 'ws';

export default async function sendLatestTokensWS(
  ws: WebSocket,
  wss: WebSocketServer,
  data: Token[]
) {
  if (sendedTokens.has(ws)) {
    const sended = sendedTokens.get(ws);
    const filteredData = data.filter(
      (token) => !sended!.has(token.address ?? token.name)
    );
    if (filteredData.length > 0) {
      wss.clients.forEach((client) => {
        if (client !== ws) {
          client.send(
            JSON.stringify({
              type: 'latestTokensRes',
              payload: filteredData,
            })
          );
        }
      });

      console.log('Sending latest tokens to all clients');

      filteredData.forEach((token) => sended!.add(token.address ?? token.name));
    } else {
      wss.clients.forEach((client) => {
        if (client !== ws) {
          client.send(
            JSON.stringify({
              type: 'latestTokensRes',
              payload: [],
            })
          );
        }
      });
    }
  } else {
    sendedTokens.set(
      ws,
      new Set(data.map((token) => token.address ?? token.name))
    );
    wss.clients.forEach((client) => {
      if (client !== ws) {
        client.send(
          JSON.stringify({
            type: 'latestTokensRes',
            payload: data,
          })
        );
      }
    });
  }
}
