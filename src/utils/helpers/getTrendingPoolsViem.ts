import { parseAbiItem, type Abi, type Address } from 'viem';

import viemClient from '../viem';
import type { Pool } from '../types/external';
import { uniswapV3FactoryAddressBase } from '../constants';
import v3PoolAbi from '@/abi/V3Pool.json';
import v3FactoryAbi from '@/abi/V3Factory.json';

export async function getTrendingPoolsViem() {}

export async function getTrendingPools(): Promise<Pool[]> {
  const factory = {
    address: uniswapV3FactoryAddressBase,
    abi: v3FactoryAbi as Abi,
  };
  const latestBlock = await viemClient.getBlockNumber();
  const poolCreatedLogs = await viemClient.getLogs({
    address: factory.address as Address,
    event: parseAbiItem(
      'event PoolCreated(address token0, address token1, uint24 fee, int24 tickSpacing, address pool)'
    ),
    fromBlock: BigInt(latestBlock) - BigInt(100000),
    toBlock: 'latest',
  });

  const pools: Pool[] = [];
  console.log(poolCreatedLogs.length);

  poolCreatedLogs.forEach(async (log) => {
    const { args } = log as unknown as {
      args: {
        token0: Address;
        token1: Address;
        pool: Address;
      };
    };

    const { token0, token1, pool } = args;

    const poolContract = {
      address: pool,
      abi: v3PoolAbi as Abi,
    };

    const liquidity = await viemClient.readContract({
      ...poolContract,
      functionName: 'liquidity',
    });

    const token0Price = await calculateTokenPrice(pool, token0);
    const token1Price = await calculateTokenPrice(pool, token1);

    const volumeData = await fetchVolumeData(pool);
    const blockTimeStamp = await viemClient.getBlock({
      blockHash: log.blockHash,
    });

    pools.push({
      id: pool.toLowerCase(),
      type: 'pool',
      attributes: {
        base_token_price_usd: token0Price.usd,
        base_token_price_native_currency: token0Price.native,
        quote_token_price_usd: token1Price.usd,
        quote_token_price_native_currency: token1Price.native,
        base_token_price_quote_token: token0Price.relative,
        quote_token_price_base_token: token1Price.relative,
        address: pool.toLowerCase(),
        name: `${token0}-${token1}`,
        pool_created_at: new Date(
          Number(blockTimeStamp.timestamp) * 1000
        ).toISOString(),
        fdv_usd: calculateFDV(BigInt(liquidity as number), token0Price.usd),
        market_cap_usd: null, // Replace with real calculation if needed
        price_change_percentage: volumeData.priceChange,
        transactions: volumeData.transactions,
        volume_usd: volumeData.volume,
        reserve_in_usd: volumeData.reserve,
      },
      relationships: {
        base_token: { data: { id: token0.toLowerCase(), type: 'token' } },
        quote_token: { data: { id: token1.toLowerCase(), type: 'token' } },
        dex: { data: { id: factory.address.toLowerCase(), type: 'dex' } },
      },
    });
  });
  return pools.sort(
    (a, b) =>
      parseFloat(b.attributes.volume_usd.h24) -
      parseFloat(a.attributes.volume_usd.h24)
  );
}

async function calculateTokenPrice(pool: Address, token: Address) {
  // Implement price calculation logic based on liquidity oracles or reserves
  return { usd: '0', native: '0', relative: '0' };
}

async function fetchVolumeData(pool: Address) {
  // Implement volume and transaction aggregation based on Swap events
  return {
    volume: { m5: '0', h1: '0', h6: '0', h24: '0' },
    transactions: {
      m5: { buys: 0, sells: 0, buyers: 0, sellers: 0 },
      m15: { buys: 0, sells: 0, buyers: 0, sellers: 0 },
      m30: { buys: 0, sells: 0, buyers: 0, sellers: 0 },
      h1: { buys: 0, sells: 0, buyers: 0, sellers: 0 },
      h24: { buys: 0, sells: 0, buyers: 0, sellers: 0 },
    },
    priceChange: { m5: '0', h1: '0', h6: '0', h24: '0' },
    reserve: '0',
  };
}

function calculateFDV(liquidity: bigint, priceUsd: string): string {
  return (liquidity * BigInt(priceUsd)).toString();
}

const data = await getTrendingPools();
console.log(data);
process.exit(0);
