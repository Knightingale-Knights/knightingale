import postgres from "postgres";

// One pooled connection set per server instance. DATABASE_URL is the Supabase
// pooler string in transaction mode (port 6543), so prepared statements are off and
// queries are never pipelined: the pooler can hand each query to a different backend,
// and a pipelined query can be left waiting forever.
// Tests set DB_POOL_MAX=1: the scratch database is a single session, so parallel connections would share transactions.
const globalForSql = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForSql.sql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max_pipeline: 1,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    types: { numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) } },
  });

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;
