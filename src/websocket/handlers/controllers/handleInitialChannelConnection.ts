/**
 * @fileoverview This file will handles the initial connection to any particular channel
 */

import type { WebSocket } from 'ws';

import { getLatestPools, getLatestTokens } from '@/utils/helpers';
import client from '@/utils/redis';
import { influxLogger } from '@/utils/influxDB';
import { spawnProcess } from '#/tasks';
import type { WsMessage } from '@/websocket';

export async function handleLatestTokensChannel(ws: WebSocket) {
  spawnProcess('tasks/cron/c_getTokens.ts', 'latestTokens'); // spawns the cron job to fetch the latest tokens

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
          type: 'latestTokens-initial-response',
          payload: parsedTokens,
        })
      );
    } else {
      // if cache is empty or not available then fetch the latest tokens from api
      const latestTokens = await getLatestTokens();
      ws.send(
        JSON.stringify({
          type: 'latestTokens-initial-response',
          payload: latestTokens,
        })
      );
      await client?.set('latestTokensCron', JSON.stringify(latestTokens)); // sets the cache for other clients
    }
  } catch (e: any) {
    console.log(`Error in handleLatestTokensChannel: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Error in handleLatestTokensChannel',
      })
    );
    await influxLogger.writeLog(
      'websocket_error',
      {
        message: `Error at handleLatestTokenChannel in handleInitialChannelConnection.ts -  ${e.message}`,
      },
      { level: 'error' }
    );
  }
}

export async function handleLatestPoolChannel(ws: WebSocket) {
  spawnProcess('tasks/cron/c_getLatestPools.ts', 'latestPools'); // spawns the cron job to fetch the

  try {
    const redisCachedPools = await client?.get('latestPoolsCron'); // this is the same key which is used in `c_getLatestPools.ts`
    const parsedPools = JSON.parse(redisCachedPools ?? '[]');
    if (
      ws.readyState === ws.OPEN &&
      redisCachedPools &&
      parsedPools.length > 0
    ) {
      ws.send(
        JSON.stringify({
          type: 'latestPools-initial-response',
          payload: parsedPools,
        })
      );
    } else {
      // if cache is empty or not available then fetch the latest pools from api
      const latestPools = await getLatestPools('base');
      await client?.set('latestPoolsCron', JSON.stringify(latestPools)); // sets the cache for other clients
      ws.send(
        JSON.stringify({
          type: 'latestPools-initial-response',
          payload: latestPools,
        })
      );
    }
  } catch (e: any) {
    console.log(`Error in handleLatestPoolChannel: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Error in handleLatestPoolChannel',
      })
    );
  }
}

export async function handleTrendingPoolsChannel(ws: WebSocket) {
  spawnProcess('tasks/cron/c_getTrendingPools.ts', 'trendingPools');
  try {
    const redisCachedPools = await client?.get('trendingPoolsCron');
    const parsedPools = JSON.parse(redisCachedPools ?? '[]');
    if (
      ws.readyState === ws.OPEN &&
      redisCachedPools &&
      parsedPools.length > 0
    ) {
      ws.send(
        JSON.stringify({
          type: 'trendingPools-initial-response',
          payload: parsedPools,
        })
      );
    } else {
      const trendingPools = await getLatestPools('trending');
      await client?.set('trendingPoolsCron', JSON.stringify(trendingPools));
      ws.send(
        JSON.stringify({
          type: 'trendingPools-initial-response',
          payload: trendingPools,
        })
      );
    }
  } catch (e: any) {
    console.log(`Error in handleTrendingPoolsChannel: ${e.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Error in handleTrendingPoolsChannel',
      })
    );
  }
}

export async function handleLatestPairChannel(ws: WebSocket) {
  spawnProcess('tasks/listeners/latestCreatedPairs.ts', 'latestPairs');
  try {
    const cache = await client?.get('latestPairTask');
    if (cache) {
      const wsData: WsMessage = {
        channel: 'latestPairs',
        payload: JSON.parse(cache),
        type: 'publishToChannel',
      };
      ws.send(JSON.stringify(wsData));
    } else {
      // TODO - fetch the latest pairs from the database
    }
  } catch (error: any) {
    console.log(`Error in "handleLatestPairChannel" ${error.message}`);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: 'Error in "handleLatestPairChannel"',
      })
    );
  }
}
