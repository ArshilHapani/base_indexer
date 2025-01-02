import getTokenHoldings from '@/controllers/user/getTokenHoldings';
import requireAddress from '@/middleware/requireAddress';
import { Router } from 'express';

const userRouter = Router();

userRouter.use('/:address', requireAddress);
userRouter.use('/:address/getTokenHoldings', getTokenHoldings);

export default userRouter;
