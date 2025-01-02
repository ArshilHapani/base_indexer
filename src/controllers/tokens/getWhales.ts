import axios from 'axios';
import type { Request, Response } from 'express';

import { DEFAULT_CACHE_TIME } from '@/utils/constants';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getWhales(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { page, limit } = req.query;
    const validPage = Number.isNaN(Number(page)) ? 1 : Number(page);
    const validLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);
    const data = await getOrSetCacheRedis(
      `token-whales-${address}-${validPage}-${validLimit}`,
      () =>
        getTokenHoldersFromChainBase(
          address?.toString() ?? '',
          validPage,
          validLimit,
        ),
      DEFAULT_CACHE_TIME,
    );
    if (!data || data.length == 0) {
      res.status(404).json({
        message: 'Token holders not found',
        success: false,
      });
      return;
    }

    res.json({
      message: `Fetched ${data.length} whales`,
      success: true,
      data: data,
    });
  } catch (e) {
    console.log('Error in getTokenHolders: ', e);
    res.status(500).send({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getTokenHoldersFromChainBase(
  address: string,
  page = 1,
  limit = 20,
) {
  const BASE_CHAIN_ID = 8453;
  const url = `https://api.chainbase.online/v1/token/top-holders?chain_id=${BASE_CHAIN_ID}&contract_address=${address}&page=${page}&limit=${limit}`;
  const { data } = await axios.get(url, {
    headers: {
      'x-api-key': process.env.CHAINBASE_API_KEY ?? '',
    },
  });
  if (!data || data.data.length == 0) return [];
  return data.data;
}
