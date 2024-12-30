import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;

if (!client) {
  client = createClient({
    url: 'redis://localhost:6379',
  });

  client.on('error', (err) => {
    console.error('Redis client error', err);
  });

  client.connect().catch(console.error);
}

export default client;
