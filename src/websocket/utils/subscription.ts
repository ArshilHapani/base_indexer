import type { WebSocket } from 'ws';

const subscriptions = new Map<WebSocket, Set<string>>();

export function subscribe(ws: WebSocket, method: string) {
  if (!subscriptions.has(ws)) {
    subscriptions.set(ws, new Set());
  }
  subscriptions.get(ws)!.add(method);
}

export function unsubscribe(ws: WebSocket, method: string) {
  if (subscriptions.has(ws)) {
    subscriptions.get(ws)!.delete(method);
    if (subscriptions.get(ws)!.size === 0) {
      subscriptions.delete(ws);
    }
  }
}
