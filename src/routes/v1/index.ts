import express from 'express';

import { getLatestBlock } from '@/controllers';
import tokenRouter from './tokens';
import poolRouter from './pools';

const router = express.Router();

router.use('/tokens', tokenRouter);
router.use('/pools', poolRouter);

/* MICS Routes */
router.get('/getLatestBlock', getLatestBlock);

export default router;
