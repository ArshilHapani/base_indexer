import type { WebSocket, WebSocketServer } from 'ws';

import { channels } from '../state';
import { killProcess } from '#/tasks';
import type { WsMessage } from '..';

export default function handleClose(ws: WebSocket, wss: WebSocketServer) {
  ws.close();

  // manually close the channel and kill the process for each channel
  const poolChannel = channels.get('latestPools');
  const tokenChannel = channels.get('latestTokens');
  clearProcessesAndResource(poolChannel, 'latestPools', ws);
  clearProcessesAndResource(tokenChannel, 'latestTokens', ws);

  console.log('Client disconnected');
}

function clearProcessesAndResource(
  channel: Set<WebSocket> | undefined,
  name: WsMessage['channel'],
  ws: WebSocket
) {
  if (channel) {
    channel.delete(ws);
    if (channel.size === 0) {
      channels.delete(name);
      killProcess(name);
      console.log(`Channel ${name} is closed, and process is killed`);
    }
  }
}
