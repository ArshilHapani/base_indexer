import type { NextFunction, Request, Response } from 'express';

export default async function requireSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const secret = req.headers['x-secret'] as string;
  if (secret !== process.env.HEADER_SECRET) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized, secret is required',
    });
    return;
  }
  next();
}
