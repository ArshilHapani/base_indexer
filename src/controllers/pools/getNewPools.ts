import type { Request, Response } from 'express';

import { getLatestPools } from '@/utils/helpers';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getNewPools(req: Request, res: Response) {
  try {
    const { page, chain } = req.query;

    const data = await getOrSetCacheRedis(
      `liquidity-pools-${page ?? 1}-${chain ?? 'base'}`,
      () => getLatestPools(chain?.toString(), page?.toString())
    );
    res.status(200).json({
      message: `Fetched ${data.length} new pools`,
      success: true,
      data: data,
    });
  } catch (e: any) {
    console.log(`Error at getNewPools: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}
