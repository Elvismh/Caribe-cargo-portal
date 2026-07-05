import postgres from "postgres";

declare global {
  var __pgSql: ReturnType<typeof postgres> | undefined;
}

// Reuse the client across hot-reloads/invocations in the same runtime
// instead of opening a new pool per request.
export const sql =
  globalThis.__pgSql ??
  postgres(process.env.DATABASE_URL!, { max: 5 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgSql = sql;
}
