import type { Request, Response } from 'express';
import { ethers } from 'ethers';

import { DEFAULT_CACHE_TIME } from '@/utils/constants';
import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';
import getProvider from '@/utils/ethers';

export default async function getTokenHolders(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { page, limit } = req.query;
    const validPage = Number.isNaN(Number(page)) ? 1 : Number(page);
    const validLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);
    const data = await getOrSetCacheRedis(
      `token-holders-${address}-${validPage}-${validLimit}`,
      () =>
        getTokenHoldersFromChainBase(
          address?.toString() ?? '',
          validPage,
          validLimit
        ),
      DEFAULT_CACHE_TIME
    );
    if (!data || data.length == 0) {
      res.status(404).json({
        message: 'Token holders not found',
        success: false,
      });
      return;
    }

    res.json({
      message: 'Token holders fetched successfully',
      success: true,
      data: data,
    });
  } catch (e) {
    console.log('Error in getTokenHolders: ', e);
    res.status(500).send({
      message: 'Internal Server Error',
      success: false,
    });
  }
}

async function getTokenHoldersFromChainBase(
  address: string,
  page = 1,
  limit = 20
) {
  const BASE_CHAIN_ID = 8453;
  const url = `https://api.chainbase.online/v1/token/holders?chain_id=${BASE_CHAIN_ID}&contract_address=${address}&page=${page}&limit=${limit}`;
  const req = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.CHAINBASE_API_KEY ?? '',
    },
  });

  const data = await req.json();
  if (!data || !data.data || data.data.length == 0) return [];

  const formattedBalances = await Promise.all(
    data.data.map(async function (holder: string) {
      return await getUserBalanceTokenWise(address, holder);
    })
  );

  return formattedBalances;
}

const erc20ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

async function getUserBalanceTokenWise(address: string, user: string) {
  const tokenContract = new ethers.Contract(address, erc20ABI, getProvider());

  const rawBalance = await tokenContract.balanceOf(user);

  const decimals = await tokenContract.decimals();

  const readableBalance = BigInt(rawBalance) / BigInt(10n ** decimals);

  return {
    decimals: decimals.toString(),
    rawBalance: rawBalance.toString(),
    uiAmount: readableBalance.toString(),
    user: user,
  };
}
