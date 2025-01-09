/**
 * @fileoverview uniswapHelpers.ts - Helper functions for interacting with Uniswap V2 and V3.
 */

import { ethers } from 'ethers';

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
import provider from '../ethers';

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
  const factory = new ethers.Contract(
    uniswapV2FactoryAddress,
    uniswapV2FactoryABI,
    provider
  );
  const pairAddress = await factory.getPair(from, to);

  if (pairAddress === ethers.ZeroAddress) {
    return {
      baseTokenValue: '0',
      quoteTokenValue: '0',
      message: 'No pool found for these tokens.',
      poolAddress: ethers.ZeroAddress,
    };
  }

  const pair = new ethers.Contract(pairAddress, uniswapV2PairABI, provider);

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();

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
    const factory = new ethers.Contract(
      uniswapV3FactoryAddressBase,
      uniswapV3FactoryABI,
      provider
    );
    const poolAddress = await factory.getPool(from, to, FEE);

    if (poolAddress === ethers.ZeroAddress) {
      return {
        quote: '0',
        message: 'No pool found for these tokens.',
        poolAddress,
      };
    }

    const pool = new ethers.Contract(poolAddress, uniswapV3PoolABI, provider);

    const liquidity = await pool.liquidity();
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
      poolAddress: ethers.ZeroAddress,
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
    const uniswapV2Router = new ethers.Contract(
      uniswapV2RouterAddress,
      uniswapV2RouterABI,
      provider
    );

    const path = [from, to];
    const amountsOut = await uniswapV2Router.getAmountsOut(amountIn, path);

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
