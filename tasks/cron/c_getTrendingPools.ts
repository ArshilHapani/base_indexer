import cron from 'node-cron';
import Websocket from 'ws';

import db from '../../src/utils/db';
import { getLatestPools } from '../../src/utils/helpers';
import client from '../../src/utils/redis';
import type { WsMessage } from '../../src/websocket';

const CRONE_SCHEDULE_MINUTE = process.env.CRONE_SCHEDULE_MINUTE ?? '5';

const wsClient = new Websocket(
  process.env.WEBSOCKET_SERVER_URL ?? 'ws://localhost:5010'
);
const sended = new Set<string>();

let lastRun = new Date().toLocaleTimeString();

// clearing set after 10 minutes
setInterval(() => {
  sended.clear();
}, 60 * 10 * 1000); // 60 seconds * 10 minutes * 1000 milliseconds

async function job() {
  const trendingPools = await getLatestPools('base', undefined, true);

  const filteredPools = trendingPools.filter((token) => {
    const tokenId = token.baseTokenInfo.address;
    return !sended.has(tokenId);
  });

  filteredPools.forEach((token) => {
    sended.add(token.baseTokenInfo.address);
  });

  const createChannelData: WsMessage = {
    payload: null,
    type: 'createChannel',
    channel: 'trendingPools',
  };
  // creating a channel
  wsClient.send(JSON.stringify(createChannelData));

  const publishDataToChannel: WsMessage = {
    payload: filteredPools,
    type: 'publishToChannel',
    channel: 'trendingPools',
  };
  // publishing to the channel
  wsClient.send(JSON.stringify(publishDataToChannel));

  const dbData = trendingPools.map((token) => ({
    baseTokenAddress: token.baseTokenInfo.address,
    chainId: 8453,
    pairAddress: token.pairAddress,
    quoteTokenAddress: token.baseTokenInfo.address,
  }));

  await db.pool.createMany({
    data: dbData,
    skipDuplicates: true,
  });

  await client?.del('trendingPoolsCron'); // removes the old cache
  await client?.set('trendingPoolsCron', JSON.stringify(filteredPools));

  lastRun = new Date().toLocaleTimeString();
  console.log(`Running a task every ${CRONE_SCHEDULE_MINUTE} minutes`, lastRun);
}

// cron which runs every */x minutes
cron.schedule(`*/${CRONE_SCHEDULE_MINUTE} * * * *`, job);
console.log('Started "c_getTrendingPools" cron job!');
