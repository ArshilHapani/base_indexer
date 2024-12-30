import type { NextFunction, Request, Response } from 'express';

import { verifyAddress } from '@/utils';

export async function requireToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.params.address) {
    res.status(400).json({
      message: 'Token address is required',
      success: false,
    });
    return;
  }
  if (!verifyAddress(req.params.address)) {
    res.status(400).json({
      message: 'Invalid token address',
      success: false,
    });
    return;
  }
  next();
}
