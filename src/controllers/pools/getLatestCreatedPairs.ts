import axios from 'axios';
import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { calculateAgeFromDate } from '@/utils';
import type { MobulaAPIPoolType } from '@/utils/types/external';
import type { RequiredPoolData } from '@/utils/types/wsResponses';

export default async function getLatestCreatedPairs(
  req: Request,
  res: Response
) {
  try {
    const { chain } = req.query;
    const data = await getOrSetCacheRedis(
      `latest-pairs-${chain?.toString() ?? 'base'}`,
      () => getLatestPairs(chain?.toString() ?? 'Base')
    );

    res.json({
      message: `Fetched ${data.length} latest created pairs`,
      success: true,
      data: data,
    });
  } catch (e: any) {
    console.log(`Error at getLatestCreatedPairs: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getLatestPairs(chain?: string): Promise<RequiredPoolData[]> {
  const url = `https://api.mobula.io/api/1/market/query/token?sortBy=listed_at&sortOrder=desc&blockchain=${chain}`;
  const { data, status } = await axios.get<MobulaAPIPoolType>(url, {
    headers: {
      Authorization: process.env.MOBULA_API_KEY,
    },
  });
  return status !== 200
    ? []
    : data.data.map((pair) => {
        const tokenPair = pair.pairs[0];
        return {
          pairAddress: pair.address,
          quoteTokenAddress: tokenPair.quoteToken,
          baseTokenInfo: {
            address: tokenPair.baseToken,
            age: calculateAgeFromDate(pair.listed_at),
            decimals: tokenPair.token0.decimals,
            holdersCount: 0, // TODO
            liquidityInUSD: tokenPair.liquidity.toString(),
            logo: tokenPair.token0.logo ?? '',
            name: tokenPair.token0.name,
            symbol: tokenPair.token0.symbol,
            tx24h: tokenPair.trades_24h,
            volume24h: tokenPair.volume_24h.toString(),
          },
          priceInfo: {
            priceUSDC: tokenPair.price_change_24h.toString(),
            priceChange5m: tokenPair.price_change_5min.toString(),
            priceChange1h: tokenPair.price_change_1h.toString(),
            priceChange6h: tokenPair.price_change_4h.toString(),
            priceChange24h: tokenPair.price_change_12h.toString(),
          },
          audit: {
            insiders: 0,
            isHoneyPot: false,
            isVerified: true,
            locked: false,
            renounced: false,
          },
        };
      });
}
