import type { WebSocket, WebSocketServer } from 'ws';

import { channels } from '../state';
import { killProcess } from '#/tasks';
import type { ChannelTypes } from '..';
import chalk from 'chalk';

export default function handleClose(ws: WebSocket, wss: WebSocketServer) {
  ws.close();

  // manually close the channel and kill the process for each channel
  channels.entries().forEach(([name, channels]) => {
    clearProcessesAndResource(channels, name, ws);
  });

  console.log('Client disconnected');
}

function clearProcessesAndResource(
  channel: Set<WebSocket> | undefined,
  name: ChannelTypes,
  ws: WebSocket
) {
  if (channel) {
    channel.delete(ws);
    if (channel.size === 0) {
      channels.delete(name);
      killProcess(name);
      console.log(
        chalk.bgYellowBright(`Channel ${name} is closed, and process is killed`)
      );
    }
  }
}
