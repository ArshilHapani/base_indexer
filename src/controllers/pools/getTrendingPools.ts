import type { Request, Response } from 'express';

import { getLatestPools } from '@/utils/helpers';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getTrendingPools(req: Request, res: Response) {
  try {
    const { page, chain } = req.query;

    const data = await getOrSetCacheRedis(
      `liquidity-trending-pools-${page ?? 1}-${chain ?? 'base'}`,
      () => getLatestPools(chain?.toString(), page?.toString(), true)
    );
    res.status(200).json({
      message: `Fetched ${data.length} trending pools`,
      success: true,
      data: data,
    });
  } catch (e: any) {
    console.log(`Error at getTrendingPools: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error due to ' + e.message,
      success: false,
    });
  }
}
