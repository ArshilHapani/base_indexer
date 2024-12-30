import type { Request, Response } from 'express';

import provider from '@/utils/ethers';
import { parseLogs } from '@/utils';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { DEFAULT_CACHE_TIME } from '@/utils/constants';

export default async function getRecentTransactions(
  req: Request,
  res: Response
) {
  try {
    const { address } = req.params;
    const blockNumber = await getOrSetCacheRedis(
      'blockNumber',
      async function () {
        return await provider().getBlockNumber();
      },
      DEFAULT_CACHE_TIME
    );

    const blockNumberInHash = `0x${Math.max(0, blockNumber - 90000).toString(
      16
    )}`;
    const logs = await getOrSetCacheRedis(
      `transactions-${address}`,
      async function () {
        return await provider().getLogs({
          address: [address],
          fromBlock: blockNumberInHash,
          toBlock: 'latest',
          topics: [
            // topics for Transfer event
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // from
            '0x00000000000000000000000056e6983d59bf472ced0e63966a14d94a3a291589', // to
            '0x000000000000000000000000860dca8b0e583c59b2642921b9241cd991afca42', // value
          ],
        });
      },
      DEFAULT_CACHE_TIME
    );

    const processedLogs = await getOrSetCacheRedis(
      `processed-logs-${address}`,
      async function () {
        return await parseLogs(logs); // network intensive task no need to use worker thread
      },
      DEFAULT_CACHE_TIME
    );

    res.json({
      message: 'Fetched recent transactions',
      success: true,
      data: {
        processedLogs,
      },
    });
  } catch (e: any) {
    console.log(`Error at "getRecentTransactions" controller`, e.message);
    res.status(500).json({
      message: 'Failed to fetch recent transactions',
      success: false,
    });
  }
}
