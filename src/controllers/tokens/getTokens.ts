import type { Request, Response } from 'express';

import getBaseResponse from '@/utils/helpers/getBaseResponse';

export async function getAvailableTokenAsPerChain(req: Request, res: Response) {
  try {
    const { chain } = req.query;
    if (!chain) {
      res.status(400).json(getBaseResponse('Chain is required', false));
      return;
    }
    const request = await fetch(
      `https://api.mobula.io/api/1/market/query/token?sortBy=listed_at&sortOrder=desc&blockchain=${chain}`
    );
    const data = await request.json();
    res.json({
      message: `Fetched ${data?.data?.length ?? 0} tokens for ${chain}`,
      success: true,
      data: {
        data: data.data,
      },
    });
  } catch (e: any) {
    console.log(`Error at "handleInitRequest" controller`, e.message);
    res.status(500).json(getBaseResponse('Failed to fetch tokens', false));
  }
}
