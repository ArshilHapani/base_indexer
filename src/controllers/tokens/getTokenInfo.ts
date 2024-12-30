import type { Request, Response } from 'express';

import getBaseResponse from '@/utils/helpers/getBaseResponse';

export default async function getTokenInfo(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const response = await fetch(
      `https://api.mobula.io/api/1/market/data?asset=${address}&blockchain=Base`
    );
    const data = await response.json();
    if (!data.data) {
      res.status(404).json(getBaseResponse('Token not found', false));
      return;
    }
    res.json({
      message: 'Fetched token info',
      success: true,
      data: data?.data,
    });
  } catch (e: any) {
    console.log(`Error at "getTokenInfo" controller`, e.message);
    res.status(500).json(getBaseResponse('Failed to fetch token info', false));
  }
}
