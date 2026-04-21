import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/db/client";

/**
 * Example: the storage module already persists file metadata and returns a file ID.
 * Business code can then create a separate attachment relation instead of duplicating
 * storage provider details inside domain tables.
 */

export const catalogProductAssets = pgTable("catalog_product_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  productId: uuid("product_id").notNull(),
  fileId: uuid("file_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export async function attachProductImage(input: {
  tenantId: string;
  productId: string;
  fileId: string;
}) {
  const [relation] = await db
    .insert(catalogProductAssets)
    .values({
      tenantId: input.tenantId,
      productId: input.productId,
      fileId: input.fileId,
    })
    .returning({
      id: catalogProductAssets.id,
      productId: catalogProductAssets.productId,
      fileId: catalogProductAssets.fileId,
    });

  return relation;
}

/**
 * Typical flow:
 * 1. Call /api/admin/storage/sign-upload
 * 2. Upload the file to the returned signed URL
 * 3. Use the returned `id` as `fileId`
 * 4. Link that file ID to your business entity with attachProductImage()
 */
