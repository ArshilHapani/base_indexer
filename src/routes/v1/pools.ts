import { Router } from 'express';

import getNewPools from '@/controllers/pools/getNewPools';
import getTrendingPools from '@/controllers/pools/getTrendingPools';
import getPairsTokenWise from '@/controllers/pools/getPairsTokenWise';
import getLatestCreatedPairs from '@/controllers/pools/getLatestCreatedPairs';
import getPoolTrades from '@/controllers/pools/getPoolTrades';

import requireToken from '@/middleware/requireAddress';

const poolRouter = Router();

poolRouter.get('/', getNewPools);
poolRouter.get('/trending', getTrendingPools);
poolRouter.get('/trades', getPoolTrades);

poolRouter.get('/pairs/latest', getLatestCreatedPairs);
// sets the middleware for the route
poolRouter.use('/pairs/:address', requireToken);
poolRouter.get('/pairs/:address', getPairsTokenWise);

export default poolRouter;
