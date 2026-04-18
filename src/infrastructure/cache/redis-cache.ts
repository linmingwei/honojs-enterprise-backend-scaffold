import type IORedis from "ioredis";

export function createCacheStore(redis: IORedis) {
  return {
    get: (key: string) => redis.get(key),
    set: (key: string, value: string, ttlSeconds?: number) =>
      ttlSeconds ? redis.set(key, value, "EX", ttlSeconds) : redis.set(key, value),
  };
}
