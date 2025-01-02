import express from 'express';

import tokenRouter from './tokens';
import poolRouter from './pools';
import userRouter from './user';

const router = express.Router();

router.use('/tokens', tokenRouter);
router.use('/pools', poolRouter);
router.use('/user', userRouter);

export default router;
