import { ethers } from 'ethers';
import cron from 'node-cron';
import Websocket from 'ws';

import db from '@/utils/db';
import {
  getLiquidityPools,
  getTokenDataFromLiquidityPoolRes,
} from '@/utils/helpers';
import client from '@/utils/redis';
import type { WsMessage } from '@/websocket';

const CRONE_SCHEDULE_MINUTE = process.env.CRONE_SCHEDULE_MINUTE ?? '5';
const CHANNEL_NAME = 'latestTokens';

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
  const pools = await getLiquidityPools('base');
  const latestTokens = await getTokenDataFromLiquidityPoolRes(pools);

  const filteredTokens = latestTokens.filter((token) => {
    const tokenId = token.address ?? token.tokenData.name;
    return !sended.has(tokenId);
  });

  filteredTokens.forEach((token) => {
    sended.add(token.address ?? token.tokenData.name);
  });

  const createChannelData: WsMessage = {
    payload: null,
    type: 'createChannel',
    channel: CHANNEL_NAME,
  };
  // creating a channel
  wsClient.send(JSON.stringify(createChannelData));

  const publishDataToChannel: WsMessage = {
    payload: filteredTokens,
    type: 'publishToChannel',
    channel: CHANNEL_NAME,
  };
  // publishing to the channel
  wsClient.send(JSON.stringify(publishDataToChannel));
  // reset cache

  const workerData = latestTokens.map((token) => ({
    address: token.address ?? ethers.ZeroAddress,
    name: token.tokenData.name ?? '',
    symbol: token.tokenData.symbol ?? '',
    decimals: token.tokenData.decimals ?? 0,
    totalSupply: Number(token.tokenData.totalSupply) ?? 0,
    logo: token.tokenData.logo,
    chainId: 8453, // base
  }));
  await db.token.createMany({
    data: workerData,
    skipDuplicates: true,
  });

  await client?.del('latestTokensCron'); // removes the old cache
  await client?.set('latestTokensCron', JSON.stringify(filteredTokens));

  lastRun = new Date().toLocaleTimeString();
  console.log(`Running a task every ${CRONE_SCHEDULE_MINUTE} minutes`, lastRun);
}

// cron which runs every */x minutes
cron.schedule(`*/${CRONE_SCHEDULE_MINUTE} * * * *`, job);
console.log('Started cron job!');

// job().finally(() => process.exit(0));
