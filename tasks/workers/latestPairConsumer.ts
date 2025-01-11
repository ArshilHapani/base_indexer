import { Worker } from 'bullmq';
import * as dotenv from 'dotenv';
import { WebSocket } from 'ws';

import { WsMessage } from '../../src/websocket';
import db from '../../src/utils/db';

dotenv.config();

const ws = new WebSocket(
  process.env.WEBSOCKET_SERVER_URL ?? 'ws://localhost:5000'
);

// creating channel only once
const createChannelPayload: WsMessage = {
  channel: 'latestPairs',
  payload: null,
  type: 'createChannel',
};
ws.send(JSON.stringify(createChannelPayload));

new Worker(
  'latestCreatedPair',
  async function (job) {
    const logs = job.data ?? [];
    try {
      const existingData = await db.pair.findFirst({
        where: {
          pairAddress: logs[2],
        },
      });
      if (existingData) return;

      const wsData: WsMessage = {
        channel: 'latestPairs',
        payload: {
          baseToken: logs[0],
          quoteToken: logs[1],
          pairAddress: logs[2],
        },
        type: 'publishToChannel',
      };

      await db.pair.create({
        data: {
          baseTokenAddress: logs[0],
          quoteTokenAddress: logs[1],
          pairAddress: logs[2],
          chainId: 8453,
        },
      });
      console.log(`Pair created`);
    } catch (e: any) {
      console.log(`Error at "latestPairConsumer" worker`, e.message);
    }
  },
  {
    connection: {
      url: process.env.REDIS_BACKEND_URI,
    },
  }
);
