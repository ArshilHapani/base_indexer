import { influxLogger } from '../influxDB';
import client from '../redis';

// Set this to true to see cache logs.
const SHOW_CACHE_LOGS = false;

/**
 * This function is used to get or set cache in redis.
 * # Usage
 * ```typescript
 * import getOrSetCacheRedis from './getOrSetRedisCache';
 * const data = await getOrSetCacheRedis('cache-key', async function () { ... });
 * ```
 *
 * @param key The key which you want to set as cache key, which further can be used to retrieve the cache.
 * @param cb The callback function which will be called if the cache is not found.
 * @param expirySeconds The time in seconds after which the cache will expire.
 * @param disableCache Disable the cache, useful for testing.
 * @returns Data from cache or from the callback function.
 */
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
    if (Array.isArray(freshData) && freshData.length === 0) {
      return freshData;
    }

    if (SHOW_CACHE_LOGS)
      console.log("Cache miss for key: '\x1b[31m%s\x1b[0m'", key);

    await client.set(key, JSON.stringify(freshData), {
      EX: expirySeconds,
    });

    return freshData;
  } catch (error: any) {
    console.error(`Cache error for ${key}:`, error);
    await influxLogger.writeLog('redis_error', {
      message: `Error in getOrSetCacheRedis function in getOrSetRedisCache.ts for key ${key}: ${error.message}`,
    });
    return cb();
  }
}
