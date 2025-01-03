import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;

if (!client) {
  client = createClient({
    url: process.env.REDIS_BACKEND_URI,
  });

  client.on('error', (err) => {
    console.error('Redis client error', err);
  });

  client.connect().catch(console.error);
}

export default client;
