import WebSocket from 'ws';

import { channels } from '../state';
import type { WsMessage } from '..';

/**
 *
 * @param name The name of the channel
 */
export function createChannel(name: WsMessage['channel']) {
  if (!channels.has(name)) {
    channels.set(name, new Set());
    console.log(`Created channel ${name}`);
  }
}

/**
 * @note This function creates a channel if it doesn't exist
 * @param ws WebSocket instance
 * @param name Name of the channel
 */
export function subscribeToChannel(ws: WebSocket, name: WsMessage['channel']) {
  if (!channels.has(name)) {
    createChannel(name);
  }
  channels.get(name)?.add(ws);
  ws.send(JSON.stringify({ type: `channel:${name}-subscribed` }));
  console.log(`Subscribed to ${name}`);
}

/**
 *
 * @param ws WebSocket instance
 * @param name Name of the channel
 */
export function unsubscribeFromChannel(
  ws: WebSocket,
  name: WsMessage['channel']
) {
  if (channels.has(name)) {
    channels.get(name)!.delete(ws);

    // remove the channel if there are no subscribers
    if (channels.get(name)!.size === 0) {
      channels.delete(name);
    }
    ws.send(JSON.stringify({ type: `channel:${name}-unsubscribed` }));

    console.log(`Unsubscribed from ${name}`);
  }
}

/**
 *
 * @param name Then ame of the channel
 * @param message Message (by default it's any)
 */
export function publishToChannel<T = any>(
  name: WsMessage['channel'],
  message: T
) {
  if (channels.has(name)) {
    const channel = channels.get(name)!;
    channel.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: `channel:${name}-update`,
            payload: message,
          })
        );
      }
    });

    console.log(`Published to ${name}`);
  }
}
