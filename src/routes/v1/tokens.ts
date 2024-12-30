import { Router } from 'express';

import getTokenInfo from '@/controllers/tokens/getTokenInfo';
import getRecentTransactions from '@/controllers/tokens/transactions/getRecentTransactions';
import { requireToken } from '@/middleware/requireAddress';

const tokenRouter = Router();

tokenRouter.use('/:address', requireToken);

tokenRouter.get('/:address', getTokenInfo);
tokenRouter.get('/:address/getRecentTransactions', getRecentTransactions);

export default tokenRouter;
