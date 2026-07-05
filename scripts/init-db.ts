/**
 * One-off: creates the `accounts` table if it doesn't exist yet.
 * Run with: npx tsx scripts/init-db.ts
 * Requires DATABASE_URL in the environment (e.g. `.env.local`, pulled via
 * `vercel env pull` or copied from the Vercel dashboard).
 */
import { sql } from "../src/lib/db";

async function main() {
  await sql`
    create table if not exists accounts (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      password_hash text not null,
      must_change_password boolean not null default true,
      can_view_kpis boolean not null default false,
      can_view_case_detail boolean not null default false,
      token_version integer not null default 0,
      failed_attempts integer not null default 0,
      locked_until timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  console.log("accounts table ready");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
