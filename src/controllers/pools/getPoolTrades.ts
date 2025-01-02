import axios from 'axios';
import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getPoolTrades(req: Request, res: Response) {
  try {
    const { poolAddress, chain } = req.query;
    if (!poolAddress) {
      res.status(400).json({
        message: 'Pool address is required',
        success: false,
      });
      return;
    }
    const data = await getOrSetCacheRedis(
      `pool-trade-${poolAddress}-${chain ?? 'base'}`,
      () => getTrades(poolAddress.toString(), chain?.toString() ?? 'base'),
    );
    res.json({
      message: `Fetched ${data?.length ?? 0} trades for ${poolAddress}`,
      success: true,
      data,
    });
  } catch (e: any) {
    console.log(`Error at getPoolTrades: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getTrades(address: string, chain: string) {
  const url = `https://api.geckoterminal.com/api/v2/networks/${chain}/pools/${address}/trades`;
  const { data } = await axios.get(url);
  return data.data;
}
