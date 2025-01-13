/**
 * @fileoverview index.ts - This file contains all the helper functions that are used in the api routes
 */

import axios from 'axios';

import getOrSetCacheRedis from './getOrSetRedisCache';
import { getTokenMetadata, getTransactionCount } from './rpcCalls';
import { calculateAgeFromDate } from '..';
import viemClient from '../viem';
import { getTokenPriceViem } from './priceDataHelpers';
import v2Pair from '@/abi/V2Pair.json';
import type { Pool, Token } from '../types/external';
import type { RequiredPoolData } from '../types/wsResponses';

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
 * @param page - The page number
 * @param trending - A boolean flag to get trending pools
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
        const balanceOfFunctionSignature = '0x70a08231';
        const decimalsFunctionSignature = '0x313ce567';
        const balanceOfCallData = `${balanceOfFunctionSignature}${user
          .slice(2)
          .padStart(64, '0')}`;
        const rawBalanceHex = await viemClient.call({
          to: token as `0x${string}`,
          data: balanceOfCallData as `0x${string}`,
        });
        const rawBalance = BigInt(rawBalanceHex.data ?? '0x');

        const decimalsHex = await viemClient.call({
          to: token as `0x${string}`,
          data: decimalsFunctionSignature as `0x${string}`,
        });
        const decimals = parseInt(decimalsHex.data ?? '0x', 16);

        const balance = (rawBalance / BigInt(10 ** decimals)).toString();

        return {
          rawBalance: rawBalance.toString(),
          balance,
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

export async function getTotalSupply(tokenAddress: string): Promise<string> {
  try {
    const totalSupplyFunctionSignature = '0x18160ddd';
    const decimalsFunctionSignature = '0x313ce567';

    const totalSupplyHex = await viemClient.call({
      to: tokenAddress as `0x${string}`,
      data: totalSupplyFunctionSignature as `0x${string}`,
    });
    const totalSupply = BigInt(totalSupplyHex.data ?? '0x');

    const decimalsHex = await viemClient.call({
      to: tokenAddress as `0x${string}`,
      data: decimalsFunctionSignature as `0x${string}`,
    });
    const decimals = parseInt(decimalsHex.data ?? '0x', 16);

    const formattedSupply = (totalSupply / BigInt(10 ** decimals)).toString();

    return formattedSupply;
  } catch (e: any) {
    console.error(`Error at "getTotalSupply" helper:`, e.message);
    return '0';
  }
}

export async function getTokenLaunchDate(
  tokenAddress: string
): Promise<string> {
  try {
    const transaction = await viemClient.getTransactionReceipt({
      hash: tokenAddress as `0x${string}`,
    });

    if (!transaction) {
      throw new Error(
        'Unable to fetch the transaction for the token contract.'
      );
    }

    const deploymentBlock = transaction.blockNumber;

    const block = await viemClient.getBlock({ blockNumber: deploymentBlock });

    if (!block) {
      throw new Error(
        'Unable to fetch the block for the deployment transaction.'
      );
    }

    const deploymentDate = new Date(Number(block.timestamp) * 1000);
    return deploymentDate.toISOString();
  } catch (e: any) {
    console.error('Error at getTokenLaunchDate:', e.message);
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
  page?: string,
  trending?: boolean
): Promise<RequiredPoolData[]> {
  try {
    const pools = await getLiquidityPools(chain, page, trending);
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
            timestamp: pool.attributes.pool_created_at,
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
              0 + Number(pool.attributes.transactions.h24.sells) ??
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

export async function getLiquidityOfPairs(
  pairAddress: `0x${string}`,
  tokenA: string,
  tokenB: string,
  baseTokenDecimals: number,
  quoteTokenDecimals: number
) {
  const [reserve0, reserve1] = (await viemClient.readContract({
    address: pairAddress,
    abi: v2Pair,
    functionName: 'getReserves',
    args: [],
  })) as bigint[];

  const [{ tokenPrice: tokenAPrice }, { tokenPrice: tokenBPrice }] =
    await Promise.all([
      await getTokenPriceViem(tokenA as `0x${string}`),
      await getTokenPriceViem(tokenB as `0x${string}`),
    ]);
  const totalTokenAPrice =
    (Number(reserve0) / 10 ** baseTokenDecimals) * tokenAPrice;
  const totalTokenBPrice =
    (Number(reserve1) / 10 ** quoteTokenDecimals) * tokenBPrice;
  const liquidityInUSD = totalTokenAPrice + totalTokenBPrice;
  return { liquidityInUSD, tokenAPrice, tokenBPrice };
}

export function calculatePrice(
  reserve0: number,
  reserve1: number,
  baseTokenDecimals: number,
  quoteTokenDecimals: number
) {
  const price =
    reserve1 / 10 ** quoteTokenDecimals / (reserve0 / 10 ** baseTokenDecimals);
  return price.toFixed(6);
}

export async function getTransactionCountViem(address: `0x${string}`) {
  const txCount = await viemClient.getTransactionCount({
    address,
    blockTag: 'latest',
  });
  return txCount;
}

export async function getTokenPrice(address: string) {
  const url =
    'https://api.chainbase.online/v1/token/price?chain_id=8453&contract_address=' +
    address;
  const { data } = await axios.get(url, {
    headers: {
      'x-api-key': process.env.CHAINBASE_API_KEY!,
    },
  });

  return (data.data.price as number) ?? -1;
}

export async function get24hrVolume(pairAddress: string) {
  try {
    const currentBlock = await viemClient.request({
      method: 'eth_blockNumber',
    });

    const blocksPerDay = 5760; // Approx. 5760 blocks in a day for Ethereum
    const startBlock = parseInt(currentBlock, 16) - blocksPerDay;

    const events = await viemClient.request({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: `0x${startBlock.toString(16)}`,
          toBlock: currentBlock,
          address: pairAddress as `0x${string}`,
          topics: [null, null, null], // Filter Swap events
        },
      ],
    });

    let totalVolume = 0;
    events.forEach((event) => {
      const amount0In = parseInt(event.data.slice(0, 66), 16);
      const amount1In = parseInt(event.data.slice(66, 130), 16);
      const amount0Out = parseInt(event.data.slice(130, 194), 16);
      const amount1Out = parseInt(event.data.slice(194, 258), 16);

      totalVolume += amount0In + amount1In + amount0Out + amount1Out;
    });
    return Number.isNaN(totalVolume / 1e18) ? 0 : totalVolume / 1e18;
  } catch (error) {
    console.error('Error fetching 24-hour volume:', error);
    return 0;
  }
}

export async function getHoldersCountViem(tokenAddress: string) {
  const startingBlock = (await viemClient.getBlockNumber()) - 10000n;
  const logs = await viemClient.getLogs({
    address: tokenAddress as `0x${string}`,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
    },
    fromBlock: startingBlock,
    toBlock: 'latest',
  });

  let holdersCtn = 0;

  logs.forEach((log) => {
    if (log && log.args) {
      const fromAddress = log.args?.from?.toLowerCase();
      const toAddress = log.args.to?.toLowerCase();

      if (fromAddress !== '0x0000000000000000000000000000000000000000')
        holdersCtn++;

      if (toAddress !== '0x0000000000000000000000000000000000000000')
        holdersCtn++;
    }
  });
  return holdersCtn;
}

export async function getTokenPairFromPool(poolAddress: `0x${string}`) {
  const [token0, token1] = (await Promise.all([
    viemClient.readContract({
      address: poolAddress,
      abi: v2Pair,
      functionName: 'token0',
    }),
    viemClient.readContract({
      address: poolAddress,
      abi: v2Pair,
      functionName: 'token1',
    }),
  ])) as [string, string];
  return {
    token0,
    token1,
  };
}
