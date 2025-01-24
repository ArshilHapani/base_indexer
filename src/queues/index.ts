import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const TokenProduceQueue = createQueue('tokenProducer');
const LatestCreatedPairQueue = createQueue('latestCreatedPair');
const LoggingQueue = createQueue('logging');

function createQueue(name: string) {
  const queue = new Queue(name, {
    connection: {
      url: process.env.REDIS_BACKEND_URI,
    },
  });
  return queue;
}

export { TokenProduceQueue, LatestCreatedPairQueue, LoggingQueue };
