import type { Request, Response } from 'express';
import axios from 'axios';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import { getTokenMetadata } from '@/utils/helpers/rpcCalls';

export default async function getTokenHoldings(req: Request, res: Response) {
  try {
    const { address } = req.params;
    let { chain } = req.query;
    chain = chain?.toString() ?? 'base';
    const data = await getOrSetCacheRedis(
      `holdings-${address}-${chain}`,
      async function () {
        const { data, status } = await axios.post(
          process.env.MAINNET_BASE_ALCHEMY_RPC_URL!,
          {
            id: 1,
            jsonrpc: '2.0',
            method: 'alchemy_getTokenBalances',
            params: [address],
          }
        );
        return status === 200 ? data.result : [];
      }
    );
    const tokensWithMetadata = await Promise.all(
      data.tokenBalances.map(async function (item: any) {
        const metadata = await getTokenMetadata(item.contractAddress);
        const numericalBalance = parseInt(
          item.tokenBalance ?? '0x',
          16
        ).toString();
        return {
          ...item,
          tokenBalance: numericalBalance,
          metadata,
        };
      })
    );

    res.json({
      message: 'Fetched token holdings',
      success: true,
      data: tokensWithMetadata,
    });
  } catch (e: any) {
    console.log(`Error at "getTokenHoldings"`, e.message);
    res.status(500).json({
      message: 'Failed to fetch token holdings',
      success: false,
    });
  }
}
