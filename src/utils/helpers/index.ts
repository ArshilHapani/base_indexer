/**
 * @fileoverview index.ts - This file contains all the helper functions that are used in the api routes
 */

import axios from 'axios';
import { ethers } from 'ethers';

import getOrSetCacheRedis from './getOrSetRedisCache';
import { getTokenMetadata, getTransactionCount } from './rpcCalls';
import provider from '../ethers';
import { tokenABI } from '../constants';
import type { Pool, RequiredPoolData, Token } from '../types/external';
import { calculateAgeFromDate } from '..';

export async function getTokenDataFromLiquidityPoolRes(
  apiRes: Pool[]
): Promise<Token[]> {
  if (!apiRes || apiRes.length === 0) {
    return [];
  }
  const tokenAddresses = apiRes.map(
    (pool) => pool.relationships.base_token.data.id.split('base_')[1]
  );
  const tokenData = await Promise.all(
    tokenAddresses.map(async function (address) {
      return getTokenMetadata(address);
    })
  );
  return await Promise.all(
    apiRes.map(async (pool, idx: number) => {
      const attributes = pool.attributes;
      const address = pool.relationships.base_token.data.id.split('base_')[1];
      const currentTokenData = tokenData[idx];
      return {
        address,
        tokenPriceUSD: attributes.base_token_price_usd ?? '0',
        tokenPriceNative: attributes.base_token_price_native_currency ?? '0',
        name: attributes.name.split(' /')[0] ?? '0',
        tokenData: {
          decimals: currentTokenData.decimals ?? 0,
          logo: currentTokenData.logo ?? null,
          name: currentTokenData.name ?? '',
          symbol: currentTokenData.symbol ?? '',
          totalSupply: currentTokenData.totalSupply ?? '0',
        },
        liquidityInUSD: attributes.reserve_in_usd ?? '0',
        poolCreatedAt: attributes.pool_created_at ?? '0',
        transactionCount: (await getTransactionCount(address)) ?? 0,
      };
    })
  );
}

/**
 * This function gets all the latest liquidity pools from geckoterminal
 * @note This function is not cached
 * @param chain - The name of chain (eth, base, bsc, polygon)
 */
export async function getLiquidityPools(
  chain?: string,
  page?: string,
  trending?: boolean
): Promise<Pool[]> {
  try {
    if (!chain) {
      chain = 'base';
    }
    const { data, status } = await axios.get(
      `https://api.geckoterminal.com/api/v2/networks/${chain}/${
        trending ? 'trending_pools' : 'new_pools'
      }?page=${page ?? 1}`
    );
    return status === 200 ? data.data : [];
  } catch (e: any) {
    console.log(`Error at "getLiquidityPools" helper`, e.message);
    return [];
  }
}

export async function getTokenHolders(token: string, chainId?: number) {
  if (!chainId) chainId = 8453;
  return await getOrSetCacheRedis(
    `token-holders-${token}-${chainId}`,
    async function () {
      const url = `https://api.chainbase.online/v1/token/top-holders?contract_address=${token}&chain_id=${chainId}`;
      const { data, status } = await axios.get(url, {
        headers: {
          'x-api-key': process.env.CHAINBASE_API_KEY!,
        },
      });
      if (status == 429) throw new Error('Rate limit exceeded');
      return status === 200 ? data : [];
    }
  );
}

export async function getTokenHoldersCount(token: string, chainId?: number) {
  // 10ms timeout
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (!chainId) chainId = 8453;
  return await getOrSetCacheRedis(
    `token-holders-count-${token}-${chainId}`,
    async function () {
      const url = `https://api.chainbase.online/v1/token/top-holders?contract_address=${token}&chain_id=${chainId}`;
      const { data, status } = await axios.get(url, {
        headers: {
          'x-api-key': process.env.CHAINBASE_API_KEY!,
        },
      });

      if (status == 429) throw new Error('Rate limit exceeded');
      return status === 200 ? data.count : 0;
    }
  );
}

export async function getUserBalance({
  user,
  token,
}: {
  user: string;
  token: string;
}): Promise<{
  rawBalance: string;
  balance: string;
  decimals: string;
}> {
  try {
    const data = await getOrSetCacheRedis(
      `user-balance-${user}-${token}`,
      async function () {
        const tokenContract = new ethers.Contract(token, tokenABI, provider);
        const rawBalance = await tokenContract.balanceOf(user);
        const decimals = await tokenContract.decimals();
        const balance = ethers.formatUnits(rawBalance, decimals);
        return {
          rawBalance: rawBalance.toString(),
          balance: balance.toString(),
          decimals: decimals.toString(),
        };
      }
    );
    return data;
  } catch (e: any) {
    console.log(`Error at "getUserBalance" helper`, e.message);
    return {
      rawBalance: '0',
      balance: '0',
      decimals: '0',
    };
  }
}

export async function getTotalSupply(address: string): Promise<string> {
  try {
    const tokenContract = new ethers.Contract(address, tokenABI, provider);

    // Call the totalSupply function
    const totalSupply = await tokenContract.totalSupply();

    // Get the decimals of the token
    const decimals: number = await tokenContract.decimals();

    // Convert totalSupply to a human-readable string
    return ethers.formatUnits(totalSupply, decimals);
  } catch (e: any) {
    console.log(`Error at "getTotalSupply" helper`, e.message);
    return '0';
  }
}

export async function getTokenLaunchDate(address: string): Promise<string> {
  try {
    const tx = await provider.getTransactionReceipt(address);

    if (!tx) {
      throw new Error(
        'Unable to fetch the transaction for the token contract.'
      );
    }

    const deploymentBlock = tx.blockNumber;

    const block = await provider.getBlock(deploymentBlock);

    if (!block) {
      throw new Error(
        'Unable to fetch the block for the deployment transaction.'
      );
    }

    const deploymentDate = new Date(block.timestamp * 1000);
    return deploymentDate.toISOString();
  } catch (e: any) {
    console.log('error at getTokenLaunchDate');
    return '0';
  }
}

export async function getLatestTokens() {
  const pools = await getLiquidityPools('base');
  const latestTokens = await getTokenDataFromLiquidityPoolRes(pools);
  return latestTokens;
}

export async function getLatestPools(
  chain?: string,
  page?: string
): Promise<RequiredPoolData[]> {
  try {
    const pools = await getLiquidityPools(chain, page);
    return await Promise.all(
      pools.map(async (pool) => {
        const baseTokenAddress =
          pool.relationships.base_token.data.id.split('base_')[1];
        const quoteTokenAddress =
          pool.relationships.quote_token.data.id.split('base_')[1];
        const tokenMetadata = await getTokenMetadata(baseTokenAddress);
        const rateLimitReached = true; // flag to used for development
        const tokenHolderCount = rateLimitReached
          ? 0
          : await getTokenHoldersCount(baseTokenAddress, 8453);
        return {
          pairAddress: pool.attributes.address,
          quoteTokenAddress,
          baseTokenInfo: {
            age: calculateAgeFromDate(pool.attributes.pool_created_at),
            address: baseTokenAddress,
            name: pool.attributes.name.split(' /')[0],
            decimals: tokenMetadata.decimals ?? 0,
            symbol: tokenMetadata.symbol ?? '',
            liquidityInUSD: pool.attributes.reserve_in_usd ?? '0',
            logo: tokenMetadata.logo ?? '',
            holdersCount: tokenHolderCount,
            tx24h:
              pool.attributes.transactions.h24.buys ??
              0 + pool.attributes.transactions.h24.sells ??
              0,
            volume24h: pool.attributes.volume_usd.h24 ?? '0',
          },
          audit: {
            insiders: 0,
            isHoneyPot: false,
            isVerified: true,
            locked: false,
            renounced: false,
          },
          priceInfo: {
            priceChange1h: pool.attributes.price_change_percentage.h1,
            priceChange24h: pool.attributes.price_change_percentage.h24,
            priceChange5m: pool.attributes.price_change_percentage.m5,
            priceChange6h: pool.attributes.price_change_percentage.h6,
            priceUSDC: pool.attributes.base_token_price_usd,
          },
        } satisfies RequiredPoolData;
      })
    );
  } catch (e: any) {
    console.log('error at getLatestPools', e.message);
    return [];
  }
}
