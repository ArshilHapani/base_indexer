import { erc20Abi, zeroAddress, type Address } from 'viem';

import viemClient from '../viem';
import {
  BASE_ETH_USD_PRICE_FEED_AGGREGATOR_ADDRESS_CHAINLINK,
  uniswapV2FactoryAddress,
  uniswapV3FactoryAddressBase,
  V3_WETH_USD_POOL_ADDRESS,
  WETH_ADDRESS_BASE,
} from '../constants';
import { getPriceFromSqrtX96 } from '..';
import { getTokenPrice } from '.';

import factoryAbi from '@/abi/V2Factory.json';
import uniswapV3PoolABI from '@/abi/V3Pool.json';
import pairABI from '@/abi/V2Pair.json';
import v3FactoryAbi from '@/abi/V3Factory.json';
import aggregatorAbi from '@/abi/PriceFeed.json';

/**
 * This function fetches the price of ETH in USD from the Uniswap V3 pool
 */
export async function getEthPriceFromEthUsdPool() {
  try {
    const [sqrtPriceX96] = (await viemClient.readContract({
      functionName: 'slot0',
      abi: uniswapV3PoolABI,
      address: V3_WETH_USD_POOL_ADDRESS,
    })) as any[];

    const price = getPriceFromSqrtX96({
      SqrtX96: sqrtPriceX96,
      Decimal0: 18,
      Decimal1: 6,
    });
    return Number(price.price0In1) ?? 0;
  } catch (e: any) {
    console.log(`Error in getEthPriceFromEthUsdPool: ${e.message}`);
    return 0;
  }
}

export async function getEthPriceFromChainlink() {
  try {
    const data = (await viemClient.readContract({
      address: BASE_ETH_USD_PRICE_FEED_AGGREGATOR_ADDRESS_CHAINLINK,
      abi: aggregatorAbi,
      functionName: 'latestRoundData',
    })) as bigint[];
    const price = data[1] / 10n ** 8n;
    return price;
  } catch (e: any) {
    console.log(`Error in getEthPriceFromChainlink: ${e.message}`);
    return await getEthPriceFromEthUsdPool();
  }
}

export async function getTokenPriceV3(
  pool: Address,
  token0Address: Address,
  token1Address: Address
) {
  try {
    const [sqrtPriceX96] = (await viemClient.readContract({
      functionName: 'slot0',
      abi: uniswapV3PoolABI,
      address: pool,
    })) as any[];
    const token0Decimals = await getTokenDecimals(token0Address);
    const token1Decimals = await getTokenDecimals(token1Address);

    const price = getPriceFromSqrtX96({
      SqrtX96: sqrtPriceX96,
      Decimal0: token0Decimals,
      Decimal1: token1Decimals,
    });
    return Number(price.price0In1) ?? 0;
  } catch (e: any) {
    console.log(`Error in getTokenPriceV3: ${e.message}`);
    return 0;
  }
}

export async function getReservesAndIdentifyTokens(pairAddress: Address) {
  try {
    const [token0, token1] = (await Promise.all([
      viemClient.readContract({
        address: pairAddress,
        abi: pairABI,
        functionName: 'token0',
        args: [],
      }),
      viemClient.readContract({
        address: pairAddress,
        abi: pairABI,
        functionName: 'token1',
        args: [],
      }),
    ])) as Address[];

    const [reserve0, reserve1] = (await viemClient.readContract({
      address: pairAddress,
      abi: pairABI,
      functionName: 'getReserves',
      args: [],
    })) as bigint[];

    let wethReserve: bigint;
    let tokenReserve: bigint;

    if (token0.toLowerCase() === WETH_ADDRESS_BASE.toLowerCase()) {
      wethReserve = reserve0;
      tokenReserve = reserve1;
    } else if (token1.toLowerCase() === WETH_ADDRESS_BASE.toLowerCase()) {
      wethReserve = reserve1;
      tokenReserve = reserve0;
    } else {
      throw new Error('WETH is not part of this pair.');
    }
    return { wethReserve, tokenReserve };
  } catch (error: any) {
    console.error('Error identifying reserves:', error.message);
    return {
      wethReserve: BigInt(0),
      tokenReserve: BigInt(0),
    };
  }
}

export async function getTokenDecimals(tokenAddress: Address): Promise<number> {
  try {
    const decimals = await viemClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    return Number(decimals);
  } catch (e: any) {
    console.log(`Error getting token decimals: ${e.message}`);
    return 18; // Default to 18 if unable to fetch
  }
}

/**
 * This function uses v2 and v3 Uniswap to fetch the price of a token in USD, if the token is not found in v2 or v3, it will return the price from chain base api
 * @param address The address of the token
 * @returns price of the token in USD
 */
export async function getTokenPriceViem(
  address: Address
): Promise<{ ethPrice: number; tokenPrice: number }> {
  try {
    const ethPrice = await getEthPriceFromEthUsdPool();
    if (address === WETH_ADDRESS_BASE)
      return { ethPrice, tokenPrice: ethPrice };

    const pair = await viemClient.readContract({
      address: uniswapV2FactoryAddress,
      abi: factoryAbi,
      functionName: 'getPair',
      args: [WETH_ADDRESS_BASE, address],
    });

    let v3PoolAddress: Address = zeroAddress;
    if (pair === zeroAddress) {
      const feeTier = 500;
      v3PoolAddress = (await viemClient.readContract({
        address: uniswapV3FactoryAddressBase,
        abi: v3FactoryAbi,
        functionName: 'getPool',
        args: [WETH_ADDRESS_BASE, address, feeTier],
      })) as Address;

      if (v3PoolAddress === zeroAddress) {
        throw new Error('Pair not found');
      } else {
        return {
          ethPrice,
          tokenPrice: await getTokenPriceV3(
            v3PoolAddress,
            WETH_ADDRESS_BASE,
            address
          ),
        };
      }
    }
    const { tokenReserve, wethReserve } = await getReservesAndIdentifyTokens(
      pair as Address
    );
    const tokenDecimals = await getTokenDecimals(address);
    /**
     * USD Price = (ETH Price * (Reserve of WETH / Reserve of Token)) / 10^6
     */
    const wethReserveDecimal = (Number(wethReserve) / 10 ** 18).toString();
    const tokenReserveDecimal = (
      Number(tokenReserve) /
      10 ** tokenDecimals
    ).toString();

    // Calculate price using high-precision decimal arithmetic
    const reserveRatio =
      Number(wethReserveDecimal) / Number(tokenReserveDecimal);
    const tokenPrice = ethPrice * reserveRatio;
    return {
      ethPrice,
      tokenPrice,
    };
  } catch (e: any) {
    console.log('Error at "getTokenPriceViem" helper', e.message);
    const price = await getTokenPrice(address);
    return {
      ethPrice: Number(await getEthPriceFromChainlink()),
      tokenPrice: price,
    };
  }
}
