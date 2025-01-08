import { ethers } from 'ethers';
import cron from 'node-cron';
import Websocket from 'ws';

import db from '@/utils/db';
import {
  getLiquidityPools,
  getTokenDataFromLiquidityPoolRes,
} from '@/utils/helpers';
import type { WsMessage } from '@/websocket';

let lastRun = new Date().toLocaleTimeString();

const wsClient = new Websocket(
  process.env.WEBSOCKET_SERVER_URL ?? 'ws://localhost:5010'
);

async function job() {
  const pools = await getLiquidityPools('base');
  const latestTokens = await getTokenDataFromLiquidityPoolRes(pools);
  const wsData: WsMessage = {
    type: 'call',
    payload: latestTokens,
    method: 'latestTokens',
  };
  // sending data to websocket server
  wsClient.send(JSON.stringify(wsData));

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

  lastRun = new Date().toLocaleTimeString();
  console.log('Running a task every 5 minutes', lastRun);
}

// cron which runs every */x minutes
cron.schedule('*/1 * * * *', job);
console.log('Started cron job!');

// job().finally(() => process.exit(0));
