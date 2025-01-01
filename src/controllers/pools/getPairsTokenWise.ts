import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getPairsTokenWise(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { chain } = req.query;

    const data = await getOrSetCacheRedis(
      `pair-${address}-${chain ?? 'base'}`,
      () => getPairs(address, chain?.toString()),
    );
    res.json({
      message: `Fetched ${data?.data?.pairs.length} pairs for ${address}`,
      success: true,
      data: data?.data,
    });
  } catch (e: any) {
    console.log(`Error at getPairsTokenWise: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getPairs(address: string, chain?: string) {
  const url = `https://api.mobula.io/api/1/market/pairs?asset=${address.toString()}&blockchain=${chain?.toString().toLowerCase() ?? 'base'}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
