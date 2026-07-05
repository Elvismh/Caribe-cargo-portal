/**
 * TEMPORARY one-time setup endpoint, gated by SETUP_TOKEN. Used to create
 * the `accounts` table and seed initial collaborator accounts without
 * needing local access to DATABASE_URL. Delete this file once initial
 * accounts are seeded — it should not stay in production long-term.
 */
import { sql } from "@/lib/db";
import { upsertAccount } from "@/lib/auth/accounts";
import { generateInitialPassword } from "@/lib/auth/passwords";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken || request.headers.get("x-setup-token") !== setupToken) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "init") {
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
    return Response.json({ ok: true });
  }

  if (action === "create-account") {
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const canViewKpis = Boolean(body?.canViewKpis);
    const canViewCaseDetail = Boolean(body?.canViewCaseDetail);

    if (!email) {
      return Response.json({ message: "email es requerido." }, { status: 400 });
    }

    const initialPassword = generateInitialPassword();
    await upsertAccount({ email, initialPassword, canViewKpis, canViewCaseDetail });

    return Response.json({ email, initialPassword });
  }

  return Response.json({ message: "action no reconocida." }, { status: 400 });
}
