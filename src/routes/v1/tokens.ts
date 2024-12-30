import { Router } from 'express';

import getTokenInfo from '@/controllers/tokens/getTokenInfo';
import getRecentTransactions from '@/controllers/tokens/transactions/getRecentTransactions';
import getTokenHolders from '@/controllers/tokens/getTokenHolders';
import requireToken from '@/middleware/requireAddress';

const tokenRouter = Router();

tokenRouter.use('/:address', requireToken);

tokenRouter.get('/:address', getTokenInfo);
tokenRouter.get('/:address/getRecentTransactions', getRecentTransactions);
tokenRouter.get('/:address/getTokenHolders', getTokenHolders);

export default tokenRouter;
