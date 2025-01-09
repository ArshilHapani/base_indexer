/**
 * @fileoverview This file will handles the initial connection to any particular channel
 */

import type { WebSocket } from 'ws';

import { getLatestTokens } from '@/utils/helpers';
import client from '@/utils/redis';

export async function handleLatestTokensChannel(ws: WebSocket) {
  try {
    const redisCachedTokens = await client?.get('latestTokensCron'); // this is the same key which is used in `c_getTokens.ts`
    const parsedTokens = JSON.parse(redisCachedTokens ?? '[]');
    if (
      ws.readyState === ws.OPEN &&
      redisCachedTokens &&
      parsedTokens.length > 0
    ) {
      ws.send(
        JSON.stringify({
          type: 'latestTokens-response',
          payload: parsedTokens,
        })
      );
    } else {
      // if cache is empty or not available then fetch the latest tokens from api
      const latestTokens = await getLatestTokens();
      await client?.set('latestTokensCron', JSON.stringify(latestTokens)); // sets the cache for other clients
      ws.send(
        JSON.stringify({
          type: 'latestTokens-response',
          payload: latestTokens,
        })
      );
    }
  } catch (e: any) {
    console.log(`Error in handleLatestTokensChannel: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Error in handleLatestTokensChannel',
      })
    );
  }
}
