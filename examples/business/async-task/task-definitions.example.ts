/**
 * Step 1: define stable job names and payload shapes.
 * Keep these close to your business domain, not spread across handlers.
 */

export const catalogTaskNames = {
  repriceProduct: "catalog.reprice-product",
  rebuildSearchIndex: "catalog.rebuild-search-index",
  dailyRollup: "catalog.daily-rollup",
} as const;

export type RepriceProductTask = {
  tenantId: string;
  productId: string;
  requestedBy: string;
};

export type RebuildSearchIndexTask = {
  tenantId: string;
  fullRebuild: boolean;
};

export type DailyRollupTask = {
  date: string;
};
