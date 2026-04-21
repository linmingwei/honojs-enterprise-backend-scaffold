import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { desc, eq } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/db/client";
import { requirePermission } from "@/modules/rbac/http/require-permission";

/**
 * Example: a tenant-scoped catalog module.
 *
 * In a real module you would usually split this into:
 * - persistence/schema.ts
 * - application/services.ts
 * - http/routes.ts
 * - index.ts
 */

export const catalogProducts = pgTable("catalog_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  priceCents: integer("price_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

const listProductsRoute = createRoute({
  method: "get",
  path: "/api/admin/catalog/products",
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  },
  responses: {
    200: {
      description: "Product list",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                sku: z.string(),
                priceCents: z.number(),
              }),
            ),
          }),
        },
      },
    },
  },
});

const createProductRoute = createRoute({
  method: "post",
  path: "/api/admin/catalog/products",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1),
            sku: z.string().min(1),
            priceCents: z.number().int().nonnegative(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Created product",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            sku: z.string(),
            priceCents: z.number(),
          }),
        },
      },
    },
  },
});

function requireTenantId(headerValue: string | undefined) {
  if (!headerValue) {
    throw new HTTPException(400, { message: "Missing x-tenant-id header" });
  }

  return headerValue;
}

export async function listCatalogProducts(input: {
  tenantId: string;
  limit: number;
}) {
  return db
    .select({
      id: catalogProducts.id,
      name: catalogProducts.name,
      sku: catalogProducts.sku,
      priceCents: catalogProducts.priceCents,
    })
    .from(catalogProducts)
    .where(eq(catalogProducts.tenantId, input.tenantId))
    .orderBy(desc(catalogProducts.createdAt))
    .limit(input.limit);
}

export async function createCatalogProduct(input: {
  tenantId: string;
  name: string;
  sku: string;
  priceCents: number;
}) {
  const [created] = await db
    .insert(catalogProducts)
    .values(input)
    .returning({
      id: catalogProducts.id,
      name: catalogProducts.name,
      sku: catalogProducts.sku,
      priceCents: catalogProducts.priceCents,
    });

  return created;
}

export function registerCatalogModuleExample(app: OpenAPIHono) {
  app.use("/api/admin/catalog/products", requirePermission("catalog.product.read"));

  app.openapi(listProductsRoute, async (c) => {
    const query = c.req.valid("query");
    const tenantId = requireTenantId(c.req.header("x-tenant-id"));
    const items = await listCatalogProducts({
      tenantId,
      limit: query.limit,
    });

    return c.json({ items });
  });

  app.use("/api/admin/catalog/products", requirePermission("catalog.product.create"));

  app.openapi(createProductRoute, async (c) => {
    const body = c.req.valid("json");
    const tenantId = requireTenantId(c.req.header("x-tenant-id"));
    const created = await createCatalogProduct({
      tenantId,
      name: body.name,
      sku: body.sku,
      priceCents: body.priceCents,
    });

    return c.json(created);
  });
}
