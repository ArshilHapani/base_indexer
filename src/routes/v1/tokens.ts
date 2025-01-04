import { Router } from 'express';

import getTokenInfo from '@/controllers/tokens/getTokenInfo';
import getRecentTransactions from '@/controllers/tokens/transactions/getRecentTransactions';
import getTokenHolders from '@/controllers/tokens/getTokenHolders';
import getAvailableTokenAsPerChain from '@/controllers/tokens/getTokens';
import getDiscoverTokens from '@/controllers/tokens/getDiscoverTokens';
import getWhales from '@/controllers/tokens/getWhales';

import requireToken from '@/middleware/requireAddress';

const tokenRouter = Router();

tokenRouter.get('/', getAvailableTokenAsPerChain);
tokenRouter.get('/discover', getDiscoverTokens);

// Token specific routes
tokenRouter.use('/:address', requireToken);
tokenRouter.get('/:address', getTokenInfo);
tokenRouter.get('/:address/getRecentTransactions', getRecentTransactions);
tokenRouter.get('/:address/getTokenHolders', getTokenHolders);
tokenRouter.get('/:address/getWhales', getWhales);

export default tokenRouter;
