/**
 * @fileoverview rpcCalls.ts - Helper functions to make RPC calls to Alchemy
 */

import axios from 'axios';

import getOrSetCacheRedis from './getOrSetRedisCache';
import { getTotalSupply } from '.';

export async function getTokenMetadata(address: string): Promise<{
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}> {
  try {
    return getOrSetCacheRedis(`token-metadata-${address}`, async function () {
      const { data } = await axios.post(
        process.env.MAINNET_BASE_ALCHEMY_RPC_URL!,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [address],
        },
      );
      const totalSupply = await getTotalSupply(address);
      return {
        ...data.result,
        totalSupply,
      };
    });
  } catch (e: any) {
    console.log(`Error at "getTokenMetadata" helper`, e.message);
    return {
      decimals: null,
      logo: null,
      name: null,
      symbol: null,
    };
  }
}

export async function getTransactionCount(address: string) {
  const ans = await getOrSetCacheRedis(
    `transaction-count-${address}`,
    async function () {
      const { data } = await axios.post(
        process.env.MAINNET_BASE_ALCHEMY_RPC_URL!,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address],
        },
      );
      return data;
    },
  );
  return parseInt(ans?.result ?? '0x0', 16);
}
