/**
 * @fileoverview tokenConsumer.ts is a worker file that listens to the tokenProducer queue and adds the token data to the database..
 * @note This file runs as separate process and listens to the tokenProducer queue.
 */

import { Worker } from 'bullmq';
import * as dotenv from 'dotenv';

import db from '#/src/utils/db';

dotenv.config();

type TokenData = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  logo?: string;
  chainId: number;
};

new Worker(
  'tokenProducer',
  async function (job) {
    const tokens: TokenData[] = job.data?.workerData ?? [];
    try {
      await db.token.createMany({
        data: tokens,
        skipDuplicates: true,
      });
      console.log(`Added ${tokens.length} tokens to the database`);
    } catch (e: any) {
      console.log(`Error at "tokenConsumer" worker`, e.message);
    }
  },
  {
    connection: {
      url: process.env.REDIS_BACKEND_URI,
    },
  }
);
