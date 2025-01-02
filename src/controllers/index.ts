import type { Request, Response } from 'express';

export async function defaultController(req: Request, res: Response) {
  res.json({
    message: 'Hello from stellus.',
  });
}
