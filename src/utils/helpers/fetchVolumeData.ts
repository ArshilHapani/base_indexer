import {
  parseEther,
  formatEther,
  decodeEventLog,
  type Address,
  parseAbiItem,
} from 'viem';

import V2PairAbi from '@/abi/V2Pair.json';
import viemClient from '../viem';
import { getTokenPairFromPool } from '.';
import { getTokenDecimals, getTokenPriceViem } from './priceDataHelpers';

type IntervalType = 'm5' | 'm15' | 'm30' | 'h1' | 'h6' | 'h24';

interface PricePoint {
  reserve0: bigint;
  reserve1: bigint;
  timestamp: number;
}

const volume = {
  m5: '0',
  m15: '0',
  m30: '0',
  h1: '0',
  h6: '0',
  h24: '0',
} as Record<IntervalType, string>;

const transactions = {
  m5: {
    buys: 0,
    sells: 0,
  },
  m15: {
    buys: 0,
    sells: 0,
  },
  m30: {
    buys: 0,
    sells: 0,
  },
  h1: {
    buys: 0,
    sells: 0,
  },
  h6: {
    buys: 0,
    sells: 0,
  },
  h24: {
    buys: 0,
    sells: 0,
  },
} as Record<IntervalType, { buys: number; sells: number }>;

const priceChange = {
  m5: '0',
  m15: '0',
  m30: '0',
  h1: '0',
  h6: '0',
  h24: '0',
} as Record<IntervalType, string>;

const pricePoints = {
  m5: { start: null, end: null },
  m15: { start: null, end: null },
  m30: { start: null, end: null },
  h1: { start: null, end: null },
  h6: { start: null, end: null },
  h24: { start: null, end: null },
} as Record<IntervalType, { start: PricePoint | null; end: PricePoint | null }>;

const BLOCK_DIFF = 10000n;

async function fetchVolumeDataFromV2Pools(pool: Address) {
  const { token0, token1 } = await getTokenPairFromPool(pool);
  const latestBlock = await viemClient.getBlockNumber();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const intervals = {
    m5: [currentTimestamp - 300, currentTimestamp],
    m15: [currentTimestamp - 900, currentTimestamp - 300],
    m30: [currentTimestamp - 1800, currentTimestamp - 900],
    h1: [currentTimestamp - 3600, currentTimestamp - 1800],
    h6: [currentTimestamp - 21600, currentTimestamp - 3600],
    h24: [currentTimestamp - 86400, currentTimestamp - 21600],
  } as Record<IntervalType, [number, number]>;

  // Track initial and final prices for each interval

  const logs = await viemClient.getLogs({
    address: pool,
    event: parseAbiItem('event Sync(uint112 reserve0, uint112 reserve1)'),
    fromBlock: latestBlock - BLOCK_DIFF,
    toBlock: 'latest',
  });
  console.log('sync logs ', logs.length);

  // Process Sync events to track price changes
  for (const log of logs) {
    const decoded = decodeEventLog({
      abi: V2PairAbi,
      data: log.data,
      topics: log.topics,
    });

    const { reserve0, reserve1 } = decoded.args as unknown as {
      reserve0: bigint;
      reserve1: bigint;
    };

    const block = await viemClient.getBlock({
      blockHash: log.blockHash,
    });

    const timestamp = Number(block.timestamp);
    const pricePoint = { reserve0, reserve1, timestamp };

    // Update price points for each interval
    for (const [key, [startTime, endTime]] of Object.entries(intervals)) {
      const intervalKey = key as IntervalType;
      if (timestamp >= startTime && timestamp < endTime) {
        if (!pricePoints[intervalKey].start) {
          pricePoints[intervalKey].start = pricePoint;
        }
        pricePoints[intervalKey].end = pricePoint;
      }
    }
  }

  // Calculate price changes for each interval
  for (const [key, points] of Object.entries(pricePoints)) {
    const intervalKey = key as IntervalType;
    if (points.start && points.end) {
      const startPrice =
        (points.start.reserve1 * BigInt(10 ** 18)) / points.start.reserve0;
      const endPrice =
        (points.end.reserve1 * BigInt(10 ** 18)) / points.end.reserve0;

      // Calculate percentage change
      const priceChangePercent =
        ((Number(endPrice) - Number(startPrice)) / Number(startPrice)) * 100;
      priceChange[intervalKey] = priceChangePercent.toFixed(2);
    }
  }

  // Fetch swap logs for volume and transaction counting
  const swapLogs = await viemClient.getLogs({
    address: pool,
    event: parseAbiItem(
      'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
    ),
    fromBlock: latestBlock - BLOCK_DIFF,
    toBlock: 'latest',
  });
  console.log('swap logs ', swapLogs.length);

  for (const log of swapLogs) {
    const decoded = decodeEventLog({
      abi: V2PairAbi,
      data: log.data,
      topics: log.topics,
    });

    const { amount0In, amount1In, amount0Out, amount1Out } =
      decoded.args as unknown as {
        amount0In: bigint;
        amount1In: bigint;
        amount0Out: bigint;
        amount1Out: bigint;
        sender: Address;
        to: Address;
      };

    const block = await viemClient.getBlock({
      blockHash: log.blockHash,
    });

    const timestamp = Number(block.timestamp);
    const isBuy = amount1In > 0n;
    const tradeVolume =
      parseEther(amount0In.toString() || '0') +
      parseEther(amount1In.toString() || '0') +
      parseEther(amount0Out.toString() || '0') +
      parseEther(amount1Out.toString() || '0');

    for (const [key, [startTime, endTime]] of Object.entries(intervals)) {
      if (timestamp >= startTime && timestamp < endTime) {
        const intervalKey = key as IntervalType;
        volume[intervalKey] = formatEther(
          parseEther(volume[intervalKey] || '0') + tradeVolume
        );
        if (isBuy) transactions[intervalKey].buys += 1;
        else transactions[intervalKey].sells += 1;
      }
    }
  }

  // Fetch reserve data
  const { reserve0, reserve1, timestamp } = await getPoolReserves(pool);

  const [r0Decimal, r1Decimal, token0Price, token1Price] = await Promise.all([
    getTokenDecimals(token0 as Address),
    getTokenDecimals(token1 as Address),
    getTokenPriceViem(token0 as Address),
    getTokenPriceViem(token1 as Address),
  ]);

  const adjustedReserve0 = Number(reserve0) / 10 ** r0Decimal;
  const adjustedReserve1 = Number(reserve1) / 10 ** r1Decimal;

  // Calculate reserve values in USD
  const reserve0InUsd = adjustedReserve0 * token0Price.tokenPrice;
  const reserve1InUsd = adjustedReserve1 * token1Price.tokenPrice;
  console.log({
    token0Price,
    token1Price,
    adjustedReserve0,
    adjustedReserve1,
    r0Decimal,
    r1Decimal,
    reserve0InUsd,
    reserve1InUsd,
  });

  return {
    volume,
    transactions,
    priceChange,
    reserve: {
      reserve0: adjustedReserve0.toFixed(2),
      reserve1: adjustedReserve1.toFixed(2),
      timestamp: timestamp,
      reserve0InUsd: reserve0InUsd.toFixed(2),
      reserve1InUsd: reserve1InUsd.toFixed(2),
    },
  };
}
async function getPoolReserves(poolAddress: string) {
  const [reserve0, reserve1, blockTimestampLast] =
    (await viemClient.readContract({
      address: poolAddress as Address,
      abi: V2PairAbi,
      functionName: 'getReserves',
    })) as [bigint, bigint, bigint];

  return {
    reserve0,
    reserve1,
    blockTimestampLast,
    timestamp: new Date(Number(blockTimestampLast) * 1000).toISOString(),
  };
}
export default fetchVolumeDataFromV2Pools;

const res = await fetchVolumeDataFromV2Pools(
  //   '0x87AE85c836Cf1e28eD0C8212dB646FA160D46F4B'
  '0xb909F567c5c2Bb1A4271349708CC4637D7318b4A'
);
console.log(JSON.stringify(res, null, 2));
process.exit(0);
