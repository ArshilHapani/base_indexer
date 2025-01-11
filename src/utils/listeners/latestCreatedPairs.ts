import { decodeEventLog } from 'viem';

import factoryContractABI from '@/abi/V2Factory.json';
import viemClient from '@/utils/viem';
import db from '../db';
import { getTokenMetadata } from '../helpers/rpcCalls';
import {
  get24hrVolume,
  getHoldersCountViem,
  getLiquidityOfPairs,
  getTokenPrice,
  getTokenPriceViem,
  getTransactionCountViem,
} from '../helpers';
import { calculateAgeFromDate, getNonWETHToken } from '..';
import type { RequiredPoolData } from '../types/wsResponses';

const ROUTER_CONTRACT_ADDRESS = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6';

export async function watchEventOnContract() {
  viemClient.watchContractEvent({
    address: ROUTER_CONTRACT_ADDRESS,
    abi: factoryContractABI,
    eventName: 'PairCreated',
    // pollingInterval: 3000, // 3 second
    onLogs: (logs) => {
      logs.forEach((log) => {
        (async function () {
          const timeStamp = await viemClient.getBlock({
            blockHash: log.blockHash ?? '0x',
          });
          const data = decodeEventLog({
            abi: factoryContractABI,
            eventName: 'PairCreated',
            topics: log.topics,
            data: log.data,
            strict: true,
          });
          if (data && data.args) {
            const [token0, token1, pairAddress] = data.args as `0x${string}`[];
            const { baseToken } = getNonWETHToken(token0, token1);
            const [tokenAInfo, tokenBInfo, baseTokenInfo, baseTokenPrice] =
              await Promise.all([
                getTokenMetadata(token0, true),
                getTokenMetadata(token1, true),
                getTokenMetadata(baseToken, true),
                getTokenPriceViem(baseToken as `0x${string}`),
              ]);
            const [{ liquidityInUSD }, txCtn, volume, holdersCtn] =
              await Promise.all([
                getLiquidityOfPairs(
                  pairAddress,
                  token0,
                  token1,
                  tokenAInfo.decimals ?? 18,
                  tokenBInfo.decimals ?? 18
                ),
                getTransactionCountViem(baseToken as `0x${string}`),
                get24hrVolume(pairAddress),
                getHoldersCountViem(baseToken),
              ]);

            const wsData: RequiredPoolData = {
              pairAddress,
              quoteTokenAddress: token0,
              baseTokenInfo: {
                address: baseToken,
                name: baseTokenInfo.name ?? '',
                symbol: baseTokenInfo.symbol ?? '',
                decimals: baseTokenInfo.decimals ?? 18,
                logo: baseTokenInfo.logo ?? '',
                liquidityInUSD: liquidityInUSD.toString(),
                holdersCount: holdersCtn,
                tx24h: txCtn,
                volume24h: volume.toString(),
                age: calculateAgeFromDate(
                  Number(timeStamp.timestamp).toString()
                ),
              },
              priceInfo: {
                priceUSDC: baseTokenPrice.toString(),
                priceChange5m: '0',
                priceChange1h: '0',
                priceChange6h: '0',
                priceChange24h: '0',
              },
              audit: {
                isHoneyPot: false,
                isVerified: false,
                renounced: false,
                locked: false,
                insiders: 0,
              },
            };
            console.log('wsData', wsData);

            await db.pair.create({
              data: {
                tokenA: token0,
                tokenB: token1,
                pairAddress: pairAddress,
                chainId: 8453,
                createdAt: new Date(Number(timeStamp.timestamp)),
              },
            });
            console.log(`Pair created`, data.args[3]);
          }
        })();
      });
    },
  });
}

watchEventOnContract();
