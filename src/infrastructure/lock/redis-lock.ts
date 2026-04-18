import type IORedis from "ioredis";

export function createLockManager(redis: IORedis) {
  return {
    async acquire(key: string, ttlMs: number) {
      const token = crypto.randomUUID();
      const result = await redis.set(key, token, "PX", ttlMs, "NX");
      return result === "OK" ? token : null;
    },
  };
}
