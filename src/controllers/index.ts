import type { Request, Response } from 'express';

import provider from '@/utils/ethers';

export async function defaultController(req: Request, res: Response) {
  res.json({
    message: 'Hello from stellus.',
  });
}

export async function getLatestBlock(req: Request, res: Response) {
  const blockNumber = await provider().getBlockNumber();
  if (!blockNumber) {
    res.status(500).json({
      message: 'Failed to fetch latest block',
      success: false,
    });
    return;
  }
  const hexBlockNumber = `0x${blockNumber.toString(16)}`;
  res.json({
    message: 'Fetched latest block',
    success: true,
    data: {
      blockNumber,
      hexBlockNumber,
    },
  });
}
