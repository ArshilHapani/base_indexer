import { createClient, type RedisClientType } from 'redis';

import { influxLogger } from './influxDB';

let client: RedisClientType | null = null;

if (!client) {
  client = createClient({
    url: process.env.REDIS_BACKEND_URI,
  });

  client.on('error', async (err) => {
    console.error('Redis client error', err);
    await influxLogger.writeLog(
      'redis_error',
      { message: err.message, function: 'client.on', file: 'redis.ts' },
      { level: 'error' }
    );
  });

  client.connect().catch(async (e) => {
    console.error('Redis client error', e);
    await influxLogger.writeLog(
      'redis_error',
      { message: e.message, function: 'client.connect', file: 'redis.ts' },
      { level: 'error' }
    );
  });
}

export default client;
