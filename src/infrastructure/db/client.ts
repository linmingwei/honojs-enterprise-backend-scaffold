import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const queryClient = postgres(process.env.DATABASE_URL ?? "", { max: 1 });

export const db = drizzle(queryClient);
export type Database = typeof db;
export { queryClient };
