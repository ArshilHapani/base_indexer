import express from 'express';

import { getAvailableTokenAsPerChain } from '@/controllers/tokens/getTokens';
import { getLatestBlock } from '@/controllers';
import tokenRouter from './tokens';

const router = express.Router();

router.get('/tokens', getAvailableTokenAsPerChain);

router.use('/tokens', tokenRouter);

/* MICS Routes */
router.get('/getLatestBlock', getLatestBlock);

export default router;
