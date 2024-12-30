import client from '../redis';

const SHOW_CACHE_LOGS = false;

export default async function getOrSetCacheRedis<T>(
  key: string,
  cb: () => Promise<T>,
  expirySeconds: number = 900,
  disableCache = false /** For testing */
): Promise<T> {
  if (disableCache) {
    return cb();
  }
  if (!client) {
    return cb();
  }

  try {
    const cachedData = await client.get(key);

    if (cachedData) {
      if (SHOW_CACHE_LOGS)
        console.log("Cache hit for key: '\x1b[32m%s\x1b[0m'", key);
      return JSON.parse(cachedData) as T;
    }

    const freshData = await cb();
    if (SHOW_CACHE_LOGS)
      console.log("Cache miss for key: '\x1b[31m%s\x1b[0m'", key);

    await client.set(key, JSON.stringify(freshData), {
      EX: expirySeconds,
    });

    return freshData;
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    return cb();
  }
}
