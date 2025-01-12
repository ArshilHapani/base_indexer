/**
 * @fileoverview uniswapHelpers.ts - Helper functions for interacting with Uniswap V2 and V3.
 */

import { zeroAddress, type Address } from 'viem';

import {
  FEE,
  uniswapV2FactoryABI,
  uniswapV2FactoryAddress,
  uniswapV2PairABI,
  uniswapV2RouterABI,
  uniswapV2RouterAddress,
  uniswapV3FactoryABI,
  uniswapV3FactoryAddressBase,
  uniswapV3PoolABI,
} from '@/utils/constants';
import viemClient from '../viem';

type LiquidityData = {
  message: string;
  poolAddress: string;
  quoteTokenValue: string;
  baseTokenValue: string;
};

export async function getLiquidityV2(
  from: string,
  to: string
): Promise<LiquidityData> {
  const pairAddress = (await viemClient.readContract({
    abi: uniswapV2FactoryABI,
    address: uniswapV2FactoryAddress,
    functionName: 'getPair',
    args: [from, to],
  })) as Address;

  if (pairAddress === zeroAddress) {
    return {
      baseTokenValue: '0',
      quoteTokenValue: '0',
      message: 'No pool found for these tokens.',
      poolAddress: zeroAddress,
    };
  }

  const [reserve0, reserve1] = (await viemClient.readContract({
    abi: uniswapV2PairABI,
    address: pairAddress,
    functionName: 'getReserves',
  })) as [bigint, bigint];

  const token0 = await viemClient.readContract({
    abi: uniswapV2PairABI,
    address: pairAddress,
    functionName: 'token0',
  });

  return {
    baseTokenValue: token0 === from ? reserve0.toString() : reserve1.toString(),
    quoteTokenValue:
      token0 === from ? reserve1.toString() : reserve0.toString(),
    message: 'Success',
    poolAddress: pairAddress,
  };
}

export async function getLiquidityV3(from: string, to: string) {
  try {
    const poolAddress = (await viemClient.readContract({
      abi: uniswapV3FactoryABI,
      address: uniswapV3FactoryAddressBase,
      functionName: 'getPool',
      args: [from, to, FEE],
    })) as Address;
    if (poolAddress === zeroAddress) {
      return {
        quote: '0',
        message: 'No pool found for these tokens.',
        poolAddress,
      };
    }

    const liquidity = (await viemClient.readContract({
      abi: uniswapV3PoolABI,
      address: poolAddress,
      functionName: 'liquidity',
    })) as bigint;
    return {
      quote: liquidity.toString(),
      message: 'Success',
      poolAddress,
    };
  } catch (e: any) {
    console.log(`Error at "getQuote"`, e.message);
    return {
      quote: '0',
      message: 'Internal Server Error',
      poolAddress: zeroAddress,
    };
  }
}

type QuoteData = {
  amountIn: string;
  amountOut: string;
  minAmountOut: string;
};

export async function getQuoteV2(
  from: string,
  to: string,
  amountIn: bigint,
  slippage: number
): Promise<QuoteData> {
  try {
    const path = [from, to];
    const amountsOut = (await viemClient.readContract({
      abi: uniswapV2RouterABI,
      address: uniswapV2RouterAddress,
      functionName: 'getAmountsOut',
      args: [amountIn, path],
    })) as bigint[];

    const amountOut = amountsOut[1]; // The destination token amount

    const slippagePercentage = BigInt(Math.floor(slippage * 100));
    const slippageFactor = 10000n - slippagePercentage;

    const minAmountOut = (amountOut * slippageFactor) / 10000n;

    return {
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      minAmountOut: minAmountOut.toString(),
    };
  } catch (e: any) {
    console.log(`Error at "getQuote"`, e.message);
    return {
      amountIn: '0',
      amountOut: '0',
      minAmountOut: '0',
    };
  }
}
