import type { Request, Response } from 'express';

import getBaseResponse from '@/utils/helpers/getBaseResponse';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { DEFAULT_CACHE_TIME } from '@/utils/constants';
import {
  getLiquidityPools,
  getTokenDataFromLiquidityPoolRes,
} from '@/utils/helpers';

export default async function getAvailableTokenAsPerChain(
  req: Request,
  res: Response
) {
  try {
    const { chain: queryChain } = req.query;

    let chain = queryChain?.toString().toLowerCase() ?? 'base';
    const data = await getOrSetCacheRedis(
      `tokens-${chain}`,
      () => getAllTokenList(chain.toString()),
      DEFAULT_CACHE_TIME
    );

    res.json({
      message: `Fetched ${data?.length ?? 0} tokens for ${chain}`,
      success: true,
      data,
    });
  } catch (e: any) {
    console.log(`Error at "handleInitRequest" controller`, e.message);
    res.status(500).json(getBaseResponse('Failed to fetch tokens', false));
  }
}

async function getAllTokenList(chain: string) {
  const data = await getOrSetCacheRedis(
    'liquidity-pools',
    () => getLiquidityPools(chain),
    DEFAULT_CACHE_TIME
  );
  const parsed = await getTokenDataFromLiquidityPoolRes(data);
  return parsed;
}
