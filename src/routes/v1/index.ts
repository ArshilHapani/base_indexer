import { Router } from 'express';

import tokenRouter from './tokens';
import poolRouter from './pools';
import userRouter from './user';

import requireSecret from '@/middleware/requireSecret';

const router = Router();

router.use('/', requireSecret);

router.use('/tokens', tokenRouter);
router.use('/pools', poolRouter);
router.use('/user', userRouter);

export default router;
