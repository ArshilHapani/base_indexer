import type { Request, Response } from 'express';

export default async function getNewPools(req: Request, res: Response) {
  try {
    res.status(200).json({
      message: 'Success',
      success: true,
    });
  } catch (e: any) {
    console.log(`Error at getNewPools: ${e.message}`);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false,
    });
  }
}
