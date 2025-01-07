import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const TokenProduceQueue = new Queue('tokenProducer', {
  connection: {
    url: process.env.REDIS_BACKEND_URI,
  },
});

export default TokenProduceQueue;
