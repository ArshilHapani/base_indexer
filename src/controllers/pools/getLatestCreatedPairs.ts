import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getLatestCreatedPairs(
  req: Request,
  res: Response,
) {
  try {
    const { chain } = req.query;
    const data = await getOrSetCacheRedis(
      `latest-pairs-${chain?.toString()}`,
      () => getLatestPools(chain?.toString() ?? 'Base'),
    );

    res.json({
      message: `Fetched ${data.data.length} latest created pairs`,
      success: true,
      data: data.data,
    });
  } catch (e: any) {
    console.log(`Error at getLatestCreatedPairs: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getLatestPools(chain?: string) {
  const url = `https://api.mobula.io/api/1/market/query/token?sortBy=listed_at&sortOrder=desc&blockchain=${chain}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
