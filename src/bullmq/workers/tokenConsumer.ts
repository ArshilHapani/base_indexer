import { Worker } from 'bullmq';
import * as dotenv from 'dotenv';

import db from '@/utils/db';

dotenv.config();

type TokenData = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenSupply: string;
  logo?: string;
  chainId: number;
};

new Worker(
  'tokenProducer',
  async function (job) {
    await job.data?.workerData?.forEach(async (token: TokenData) => {
      const existedToken = await db.token.findFirst({
        where: {
          address: token.address,
        },
      });
      if (existedToken) {
        console.log(`Token ${token.name} already exists in the database ❌`);
        return;
      }
      await db.token.create({
        data: {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          totalSupply: Number(token.tokenSupply) ?? 0,
          logo: token.logo ?? '',
          chainId: token.chainId,
        },
      });
      console.log(`Token ${token.name} added to the database ✅`);
    });
  },
  {
    connection: {
      url: process.env.REDIS_BACKEND_URI,
    },
  }
);
