import getOrSetCacheRedis from './getOrSetRedisCache';
import { getTokenMetadata, getTransactionCount } from './rpcCalls';

export async function getTokenDataFromLiquidityPoolRes(apiRes: any) {
  if (!apiRes.data || apiRes.data.length === 0) {
    return [];
  }
  const tokenAddresses = apiRes.data.map(
    (pool: any) => pool.relationships.base_token.data.id.split('base_')[1],
  );
  const tokenData = await Promise.all(
    tokenAddresses.map(async function (address: string) {
      return await getTokenMetadata(address);
    }),
  );
  return await Promise.all(
    apiRes.data.map(async (pool: any, idx: number) => {
      const baseToken = pool.relationships.base_token.data;
      const attributes = pool.attributes;
      const address = baseToken.id.split('base_')[1];
      return {
        address: address,
        tokenPriceUSD: attributes.base_token_price_usd,
        tokenPriceNative: attributes.base_token_price_native_currency,
        name: attributes.name.split(' /')[0],
        tokenData: tokenData[idx],
        liquidityInUSD: attributes.reserve_in_usd,
        poolCreatedAt: attributes.pool_created_at,
        swapCount24h: attributes.swap_count_24h,
        transactionCount: await getTransactionCount(address),
      };
    }),
  );
}

/**
 * This function gets all the latest liquidity from geckoterminal
 * @note This function is not cached
 * @param chain - The name of chain (eth, base, bsc, polygon)
 */
export async function getLiquidityPools(
  chain?: string,
  page?: string,
  trending?: boolean,
) {
  if (!chain) {
    chain = 'base';
  }
  const request = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/${chain}/${trending ? 'trending_pools' : 'new_pools'}?page=${page ?? 1}`,
  );
  return await request.json();
}

export async function getTokenHolders(token: string, chainId?: number) {
  if (!chainId) chainId = 8453;
  return await getOrSetCacheRedis(
    `token-holders-${token}-${chainId}`,
    async function () {
      const url = `https://api.chainbase.online/v1/token/top-holders?contract_address=${token}&chain_id=${chainId}`;
      const req = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.CHAINBASE_API_KEY!,
        },
      });
      const data = await req.json();
      if (data.message == 'ok') {
        return data.data as any[];
      }
      return [];
    },
  );
}
