import type { Request, Response } from 'express';

import { getQuoteV2 } from '@/utils/helpers/uniswapHelpers';

/**
 * This route is not cached as it is a real-time quote.
 */
export default async function getQuoteHandler(req: Request, res: Response) {
  try {
    const { from, to, amount, slippage } = req.query;

    if (!from || !to || !amount || !slippage) {
      res.status(400).json({
        message: 'Invalid Request, from, to, slippage and amount are required.',
        success: false,
      });
      return;
    }

    const data = await getQuoteV2(
      from.toString(),
      to.toString(),
      BigInt(amount.toString()) ?? 0n,
      Number(slippage) ?? 3
    );
    res.status(200).json({
      message: data.minAmountOut == '0' ? 'No quote available' : 'Success',
      success: true,
      data,
    });
  } catch (e: any) {
    console.log(`Error at "getQuote"`, e.message);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}
