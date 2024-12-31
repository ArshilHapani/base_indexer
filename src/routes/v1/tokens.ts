import { Router } from 'express';

import getTokenInfo from '@/controllers/tokens/getTokenInfo';
import getRecentTransactions from '@/controllers/tokens/transactions/getRecentTransactions';
import getTokenHolders from '@/controllers/tokens/getTokenHolders';
import { getAvailableTokenAsPerChain } from '@/controllers/tokens/getTokens';
import requireToken from '@/middleware/requireAddress';

const tokenRouter = Router();

tokenRouter.get('/', getAvailableTokenAsPerChain);

// Token specific routes
tokenRouter.use('/:address', requireToken);
tokenRouter.get('/:address', getTokenInfo);
tokenRouter.get('/:address/getRecentTransactions', getRecentTransactions);
tokenRouter.get('/:address/getTokenHolders', getTokenHolders);

export default tokenRouter;
