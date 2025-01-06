import axios from 'axios';
import { ethers } from 'ethers';

import getOrSetCacheRedis from './getOrSetRedisCache';
import { getTokenMetadata, getTransactionCount } from './rpcCalls';
import getProvider from '../ethers';
import { tokenABI } from '../constants';

const provider = getProvider();

export async function getTokenDataFromLiquidityPoolRes(apiRes: any) {
  if (!apiRes.data || apiRes.data.length === 0) {
    return [];
  }
  const tokenAddresses = apiRes.data.map(
    (pool: any) => pool.relationships.base_token.data.id.split('base_')[1],
  );
  const tokenData = await Promise.all(
    tokenAddresses.map(async function (address: string) {
      return getTokenMetadata(address);
    }),
  );
  return await Promise.all(
    apiRes.data.map(async (pool: any, idx: number) => {
      const attributes = pool.attributes;
      const address = pool.relationships.base_token.data.id.split('base_')[1];
      return {
        address,
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
  const { data, status } = await axios.get(
    `https://api.geckoterminal.com/api/v2/networks/${chain}/${trending ? 'trending_pools' : 'new_pools'}?page=${page ?? 1}`,
  );
  return status === 200 ? data : [];
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
    },
  );
}

export function hexToNumber(hex: string) {
  return parseInt(hex, 16);
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
      },
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
        'Unable to fetch the transaction for the token contract.',
      );
    }

    // Get the block number where the contract was created
    const deploymentBlock = tx.blockNumber;

    // Fetch the block details
    const block = await provider.getBlock(deploymentBlock);

    if (!block) {
      throw new Error(
        'Unable to fetch the block for the deployment transaction.',
      );
    }

    // Convert the timestamp to a human-readable format
    const deploymentDate = new Date(block.timestamp * 1000); // Convert seconds to milliseconds
    return deploymentDate.toISOString();
  } catch (e: any) {
    console.log('error at getTokenLaunchDate');
    return '0';
  }
}
