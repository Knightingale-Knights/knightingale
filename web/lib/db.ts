import postgres from "postgres";

// One pooled connection per server instance. DATABASE_URL is the Supabase
// pooler string (transaction mode), so prepared statements are off.
const globalForSql = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForSql.sql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    types: { numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) } },
  });

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;
