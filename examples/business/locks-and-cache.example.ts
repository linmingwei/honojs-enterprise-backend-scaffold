import { createCacheStore } from "@/infrastructure/cache/redis-cache";
import { createLockManager } from "@/infrastructure/lock/redis-lock";
import { createRedisClient } from "@/infrastructure/redis/client";

type DashboardSummary = {
  ordersToday: number;
  revenueCents: number;
  activeCustomers: number;
};

const redis = createRedisClient();
const cache = createCacheStore(redis);
const lockManager = createLockManager(redis);

async function queryDashboardSummaryFromDatabase(
  tenantId: string,
): Promise<DashboardSummary> {
  /**
   * Replace this with real database queries.
   */
  return {
    ordersToday: 42,
    revenueCents: 128000,
    activeCustomers: 17,
  };
}

/**
 * Example: cache-aside read pattern.
 */
export async function getTenantDashboardSummary(tenantId: string) {
  const cacheKey = `dashboard:${tenantId}:summary`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached) as DashboardSummary;
  }

  const summary = await queryDashboardSummaryFromDatabase(tenantId);
  await cache.set(cacheKey, JSON.stringify(summary), 60);
  return summary;
}

/**
 * Example: use a distributed lock to prevent duplicate work.
 *
 * Note: the current lock manager exposes acquire() only.
 * For longer-running jobs, you may want to extend the abstraction with release/renew support.
 */
export async function rebuildTenantLeaderboard(tenantId: string) {
  const lockKey = `locks:leaderboard:${tenantId}`;
  const lockToken = await lockManager.acquire(lockKey, 30_000);

  if (!lockToken) {
    return {
      skipped: true,
      reason: "leaderboard_rebuild_already_running",
    };
  }

  /**
   * Put the real rebuild logic here.
   * Keep it shorter than the TTL or extend the lock abstraction.
   */
  return {
    skipped: false,
    lockToken,
  };
}
