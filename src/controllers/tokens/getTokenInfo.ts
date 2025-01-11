import axios from 'axios';
import type { Request, Response } from 'express';

import getBaseResponse from '@/utils/helpers/getBaseResponse';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { DEFAULT_CACHE_TIME } from '@/utils/constants';

export default async function getTokenInfo(req: Request, res: Response) {
  try {
    const { address } = req.params;

    const data = await getOrSetCacheRedis(
      `token-info-${address}`,
      () => getTokensList(address),
      DEFAULT_CACHE_TIME
    );
    if (!data.data) {
      res.status(404).json(getBaseResponse('Token not found', false));
      return;
    }
    res.json({
      message: 'Fetched token info',
      success: true,
      data: data?.data,
    });
  } catch (e: any) {
    console.log(`Error at "getTokenInfo" controller`, e.message);
    res.status(500).json(getBaseResponse('Failed to fetch token info', false));
  }
}

async function getTokensList(address: string) {
  const { data } = await axios.get(
    `https://api.mobula.io/api/1/market/data?asset=${address}&blockchain=Base`,
    {
      headers: {
        Authorization: process.env.MOBULA_API_KEY,
      },
    }
  );
  return data;
}
