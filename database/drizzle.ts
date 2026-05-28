import config from "@/lib/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: config.env.databaseUrl,
});

export const db = drizzle({ client: pool, casing: "snake_case" });
