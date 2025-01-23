import { parseUnits, type Address } from 'viem';

import type { Pair } from '../types/wsResponses';
import { getTokenMetadata } from './rpcCalls';
import { getTokenDecimals, getTokenPriceViem } from './priceDataHelpers';
import { getNonWETHToken } from '..';
import {
  get24hrVolume,
  getHoldersCountViem,
  getLiquidityOfPairs,
  getTransactionCountViem,
} from '.';

export default async function getPairDataByAddress(
  pairAddress: Address,
  token0: Address,
  token1: Address,
  txHash: string,
  timeStamp: number | string
): Promise<Pair> {
  const { baseToken, quoteToken } = getNonWETHToken(
    token0 as string,
    token1 as string
  );
  const decimalB = await getTokenDecimals(quoteToken as Address);
  const {
    decimals: decimalA,
    logo,
    name,
    symbol,
    totalSupply,
  } = await getTokenMetadata(baseToken as Address);
  const baseTokenPrice = await getTokenPriceViem(baseToken as Address);
  const priceInWei = parseUnits(
    baseTokenPrice.tokenPrice.toString(),
    decimalA ?? 18
  );
  const marketCap =
    (BigInt(totalSupply ?? 0) * priceInWei) / parseUnits('1', decimalA ?? 18);

  return {
    pairAddress,
    dexName: 'Uniswap',
    pairCreationTxHash: txHash,
    baseToken,
    quoteToken,
    creationTime: timeStamp.toString(),
    baseTokenDetails: {
      name: name ?? '',
      symbol: symbol ?? '',
      uri: logo ?? '',
      mint: baseToken ?? '',
      user: pairAddress,
    },
    marketData: {
      liquidity: (
        await getLiquidityOfPairs(
          pairAddress,
          token0,
          token1,
          decimalA ?? 18,
          decimalB
        )
      ).liquidityInUSD,
      totalHolders: await getHoldersCountViem(pairAddress),
      tx_1h: await getTransactionCountViem(pairAddress),
      volume1H: await get24hrVolume(pairAddress),
      marketCap: marketCap.toString(),
    },
  };
}
