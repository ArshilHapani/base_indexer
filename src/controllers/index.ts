import type { Request, Response } from 'express';

/**
 *
 * @param req Request object
 * @param res Response object
 */
export async function defaultController(req: Request, res: Response) {
  res.json({
    message: 'Hello from stellus.',
  });
}
