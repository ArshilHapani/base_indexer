import { Router } from 'express';

import getNewPools from '@/controllers/pools/getNewPools';

const poolRouter = Router();

poolRouter.get('/', getNewPools);

export default poolRouter;
