import { createCacheStore } from "@/infrastructure/cache/redis-cache";
import { createLockManager } from "@/infrastructure/lock/redis-lock";
import { createRedisClient } from "@/infrastructure/redis/client";

/**
 * This file shows two approaches:
 * 1. how to use the current scaffold wrappers
 * 2. which common libraries many teams use instead for a more standardized setup
 */

type DashboardSummary = {
  ordersToday: number;
  revenueCents: number;
  activeCustomers: number;
};

async function queryDashboardSummaryFromDatabase(
  tenantId: string,
): Promise<DashboardSummary> {
  return {
    ordersToday: 42,
    revenueCents: 128000,
    activeCustomers: 17,
  };
}

/**
 * Current scaffold approach: thin wrappers around Redis.
 */
const redis = createRedisClient();
const cache = createCacheStore(redis);
const lockManager = createLockManager(redis);

export async function getTenantDashboardSummaryWithScaffoldCache(tenantId: string) {
  const cacheKey = `dashboard:${tenantId}:summary`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached) as DashboardSummary;
  }

  const summary = await queryDashboardSummaryFromDatabase(tenantId);
  await cache.set(cacheKey, JSON.stringify(summary), 60);
  return summary;
}

export async function rebuildTenantLeaderboardWithScaffoldLock(tenantId: string) {
  const lockKey = `locks:leaderboard:${tenantId}`;
  const lockToken = await lockManager.acquire(lockKey, 30_000);

  if (!lockToken) {
    return {
      skipped: true,
      reason: "leaderboard_rebuild_already_running",
    };
  }

  return {
    skipped: false,
    lockToken,
  };
}

/**
 * Common standardized approach:
 *
 * npm install cache-manager keyv @keyv/redis redlock
 *
 * This gives you:
 * - higher-level cache operations through cache-manager
 * - Redis-backed storage through Keyv
 * - a well-known Redis distributed lock implementation through Redlock
 */

// import { createCache } from "cache-manager";
// import { Keyv } from "keyv";
// import KeyvRedis from "@keyv/redis";
// import Redlock from "redlock";
// import IORedis from "ioredis";
//
// const redisClient = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
//
// const standardizedCache = createCache({
//   stores: [
//     new Keyv({
//       store: new KeyvRedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379"),
//     }),
//   ],
// });
//
// const redlock = new Redlock([redisClient], {
//   retryCount: 3,
//   retryDelay: 200,
// });
//
// export async function getTenantDashboardSummaryWithCommonCache(tenantId: string) {
//   const cacheKey = `dashboard:${tenantId}:summary`;
//   const cached = await standardizedCache.get<DashboardSummary>(cacheKey);
//
//   if (cached) {
//     return cached;
//   }
//
//   const summary = await queryDashboardSummaryFromDatabase(tenantId);
//   await standardizedCache.set(cacheKey, summary, 60_000);
//   return summary;
// }
//
// export async function rebuildTenantLeaderboardWithRedlock(tenantId: string) {
//   return redlock.using([`locks:leaderboard:${tenantId}`], 30_000, async () => {
//     // do the real rebuild here
//     return { ok: true };
//   });
// }
