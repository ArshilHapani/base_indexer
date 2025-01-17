import { decodeEventLog, parseAbiItem, type Abi, type Address } from 'viem';

import viemClient from '../viem';
import type { Pool } from '../types/external';
import { uniswapV3FactoryAddressBase } from '../constants';
import { getTokenPriceViem } from './priceDataHelpers';
import v3PoolAbi from '@/abi/V3Pool.json';
import v3FactoryAbi from '@/abi/V3Factory.json';
import fetchVolumeDataFromV2Pools from './fetchVolumeData';

export async function getTrendingPoolsViem(): Promise<Pool[]> {
  try {
    const latestBlock = await viemClient.getBlockNumber();
    const poolCreatedLogs = await viemClient.getLogs({
      address: uniswapV3FactoryAddressBase,
      event: parseAbiItem(
        'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
      ),
      fromBlock: latestBlock - 100n, // For testing purposes (smaller range)
      // fromBlock: latestBlock - 100000n,
      toBlock: 'latest',
    });

    const pools: Pool[] = [];
    console.log(poolCreatedLogs.length);
    for (const log of poolCreatedLogs) {
      const logParsed = decodeEventLog({
        abi: v3FactoryAbi as Abi,
        topics: log.topics,
        data: log.data,
        eventName: 'PoolCreated',
      });

      const { token0, token1, pool } = logParsed.args as unknown as {
        token0: Address;
        token1: Address;
        pool: Address;
      };

      const poolContract = {
        address: pool,
        abi: v3PoolAbi as Abi,
      };
      const liquidity = await viemClient.readContract({
        ...poolContract,
        functionName: 'liquidity',
      });
      console.log('liquidity', liquidity);
      const { ethPrice, tokenPrice: token0Price } = await getTokenPriceViem(
        token0
      );
      const { tokenPrice: token1Price } = await getTokenPriceViem(token1);

      const volumeData = await fetchVolumeDataFromV2Pools(pool);
      const blockTimeStamp = await viemClient.getBlock({
        blockHash: log.blockHash,
      });

      pools.push({
        id: pool.toLowerCase(),
        type: 'pool',
        attributes: {
          base_token_price_usd: token0Price.toString(),
          base_token_price_native_currency: 'NA',
          quote_token_price_usd: token1Price,
          quote_token_price_native_currency: token1Price / ethPrice,
          base_token_price_quote_token: token0Price / token1Price,
          quote_token_price_base_token: token1Price / token0Price,
          address: pool.toLowerCase(),
          name: `${token0} / ${token1}`,
          pool_created_at: new Date(
            Number(blockTimeStamp.timestamp) * 1000
          ).toISOString(),
          fdv_usd: calculateFDV(BigInt(liquidity as number), token0Price),
          market_cap_usd: null, // Replace with real calculation if needed
          price_change_percentage: volumeData.priceChange,
          // TODO fix this with real data
          transactions: {
            h1: {
              buyers: volumeData.volume.h1,
              sellers: volumeData.volume.h1,
              buys: volumeData.volume.h1,
              sells: volumeData.volume.h1,
            },
            h24: {
              buyers: volumeData.volume.h24,
              sellers: volumeData.volume.h24,
              buys: volumeData.volume.h24,
              sells: volumeData.volume.h24,
            },
            m15: {
              buyers: volumeData.volume.m15,
              sellers: volumeData.volume.m15,
              buys: volumeData.volume.m15,
              sells: volumeData.volume.m15,
            },
            m30: {
              buyers: volumeData.volume.m30,
              sellers: volumeData.volume.m30,
              buys: volumeData.volume.m30,
              sells: volumeData.volume.m30,
            },
            m5: {
              buyers: volumeData.volume.m5,
              sellers: volumeData.volume.m5,
              buys: volumeData.volume.m5,
              sells: volumeData.volume.m5,
            },
          },
          volume_usd: volumeData.volume,
          reserve_in_usd: volumeData.reserve.reserve0,
        },
        relationships: {
          base_token: { data: { id: token0.toLowerCase(), type: 'token' } },
          quote_token: { data: { id: token1.toLowerCase(), type: 'token' } },
          dex: {
            data: {
              id: uniswapV3FactoryAddressBase.toLowerCase(),
              type: 'dex',
            },
          },
        },
      });
    }

    return pools.sort(
      (a, b) =>
        parseFloat(b.attributes.volume_usd.h24.toString() ?? '') -
        parseFloat(a.attributes.volume_usd.h24.toString() ?? '')
    );
  } catch (e: any) {
    console.log(e);
    return [];
  }
}

function calculateFDV(liquidity: bigint, priceUsd: string | number): string {
  return (liquidity * BigInt(priceUsd)).toString();
}

const data = await getTrendingPoolsViem();
console.log(data);
process.exit(0);
