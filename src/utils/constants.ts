export const DEFAULT_CACHE_TIME =
  process.env.NODE_ENV === 'development' ? 60 * 60 * 3 /** 3 hours */ : 60; // 1 minute
