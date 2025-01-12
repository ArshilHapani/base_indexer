import type { Address } from 'viem';

import pairAbi from '@/abi/V2Pair.json';
import type { RequiredPoolData } from '../types/wsResponses';
import viemClient from '../viem';
import { getTokenMetadata } from './rpcCalls';
import { getTokenDecimals, getTokenPriceViem } from './priceDataHelpers';
import { calculateAgeFromDate, getNonWETHToken } from '..';
import {
  get24hrVolume,
  getHoldersCountViem,
  getLiquidityOfPairs,
  getTransactionCountViem,
} from '.';

export default async function getPairDataByAddress(
  pairAddress: Address,
  timeStamp: number | string
): Promise<RequiredPoolData> {
  const [tokenA, tokenB] = await Promise.all([
    viemClient.readContract({
      abi: pairAbi,
      address: pairAddress,
      functionName: 'token0',
    }),
    viemClient.readContract({
      abi: pairAbi,
      address: pairAddress,
      functionName: 'token1',
    }),
  ]);
  const { baseToken, quoteToken } = getNonWETHToken(
    tokenA as string,
    tokenB as string
  );
  const [decimalA, decimalB] = await Promise.all([
    getTokenDecimals(baseToken as Address),
    getTokenDecimals(quoteToken as Address),
  ]);
  const [baseTokenInfo, { liquidityInUSD }] = await Promise.all([
    getTokenMetadata(baseToken),
    getLiquidityOfPairs(pairAddress, baseToken, quoteToken, decimalA, decimalB),
  ]);
  return {
    pairAddress,
    quoteTokenAddress: quoteToken,

    baseTokenInfo: {
      address: baseToken,
      age: calculateAgeFromDate(timeStamp),
      decimals: baseTokenInfo.decimals ?? 18,
      holdersCount: await getHoldersCountViem(baseToken),
      liquidityInUSD: liquidityInUSD.toString(),
      logo: baseTokenInfo.logo ?? '',
      name: baseTokenInfo.name ?? '',
      symbol: baseTokenInfo.symbol ?? '',
      timestamp: timeStamp,
      tx24h: await getTransactionCountViem(baseToken as Address),
      volume24h: (await get24hrVolume(pairAddress)).toString(),
    },
    audit: {
      insiders: 0,
      isHoneyPot: false,
      isVerified: true,
      locked: false,
      renounced: false,
    },
    priceInfo: {
      priceChange1h: '0',
      priceChange24h: '0',
      priceChange5m: '0',
      priceChange6h: '0',
      priceUSDC: (await getTokenPriceViem(baseToken as Address)).toString(),
    },
  };
}
