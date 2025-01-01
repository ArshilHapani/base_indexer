import type { Request, Response } from 'express';

import { getLiquidityPools, getTokenHolders } from '@/utils/helpers';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { getTokenMetadata } from '@/utils/helpers/rpcCalls';

export default async function getTrendingPools(req: Request, res: Response) {
  try {
    const { page, chain } = req.query;

    const data = await getOrSetCacheRedis(
      `liquidity-trending-pools-${page ?? 1}-${chain ?? 'base'}`,
      () => getLiquidityPools(chain?.toString(), page?.toString(), true),
    );
    const parsed = await Promise.all(
      data.data.map(async (pool: any) => {
        const address = pool.relationships.base_token.data.id.split('base_')[1];
        const tokenMetadata = await getTokenMetadata(address);
        const tokenHolders = await getTokenHolders(address);
        return {
          quoteTokenAddress: address,
          age: calculateAgeFromDate(pool.attributes.pool_created_at),
          liquidity: pool.attributes.reserve_in_usd,
          holders: tokenHolders.length,
          baseTokenPriceInUSD: pool.attributes.base_token_price_usd,
          baseTokenPriceInNativeCurrency:
            pool.attributes.base_token_price_native_currency,
          token: tokenMetadata,
          ...pool,
        };
      }),
    );
    res.status(200).json({
      message: `Fetched ${parsed.length} trending pools`,
      success: true,
      data: parsed,
    });
  } catch (e: any) {
    console.log(`Error at getNewPools: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

function calculateAgeFromDate(dt: string) {
  const date = new Date(dt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} days`;
}
