import axios from 'axios';
import type { Request, Response } from 'express';

import getOrSetCacheRedis from '@/utils/helpers/getOrSetRedisCache';

export default async function getDiscoverTokens(req: Request, res: Response) {
  try {
    const data = await getOrSetCacheRedis('discover-token', async function () {
      const { data, status } = await axios.get(
        'https://api.mobula.io/api/1/metadata/trendings'
      );
      return status === 200 ? data : [];
    });
    res.status(200).json({
      message: `Fetched ${data.length} discover tokens`,
      success: true,
      data,
    });
  } catch (e: any) {
    console.log(`Error at "getDiscoverTokens" controller`, e.message);
    res.status(500).json({
      message: 'Failed to fetch discover tokens',
      success: false,
    });
  }
}
