import axios from 'axios';
import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { DEFAULT_CACHE_TIME } from '@/utils/constants';

export default async function getRecentTransactions(
  req: Request,
  res: Response,
) {
  try {
    const { address } = req.params;

    const logs = await getOrSetCacheRedis(
      `transactions-${address}`,
      async function () {
        const { data, status } = await axios.get(
          `https://api.chainbase.online/v1/token/transfers?chain_id=8453&contract_address=${address}`,
          {
            headers: {
              'x-api-key': process.env.CHAINBASE_API_KEY,
            },
          },
        );
        return status === 200 ? data : [];
      },
      DEFAULT_CACHE_TIME,
    );

    res.json({
      message: `Fetched ${logs.data.length} transactions`,
      success: true,
      data: logs.data,
    });
  } catch (e: any) {
    console.log(`Error at "getRecentTransactions" controller`, e.message);
    res.status(500).json({
      message: 'Failed to fetch recent transactions',
      success: false,
    });
  }
}
