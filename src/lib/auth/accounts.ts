import { sql } from "@/lib/db";
import { hashPassword, verifyPassword } from "./passwords";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  canViewKpis: boolean;
  canViewCaseDetail: boolean;
  tokenVersion: number;
  failedAttempts: number;
  lockedUntil: Date | null;
}

interface AccountRow {
  id: string;
  email: string;
  password_hash: string;
  must_change_password: boolean;
  can_view_kpis: boolean;
  can_view_case_detail: boolean;
  token_version: number;
  failed_attempts: number;
  locked_until: Date | null;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    mustChangePassword: row.must_change_password,
    canViewKpis: row.can_view_kpis,
    canViewCaseDetail: row.can_view_case_detail,
    tokenVersion: row.token_version,
    failedAttempts: row.failed_attempts,
    lockedUntil: row.locked_until,
  };
}

export async function getAccountByEmail(email: string): Promise<Account | null> {
  const rows = await sql<
    AccountRow[]
  >`select * from accounts where email = ${email.toLowerCase()}`;
  return rows[0] ? toAccount(rows[0]) : null;
}

export async function getAccountById(id: string): Promise<Account | null> {
  const rows = await sql<AccountRow[]>`select * from accounts where id = ${id}`;
  return rows[0] ? toAccount(rows[0]) : null;
}

export type LoginResult =
  | { kind: "ok"; account: Account }
  | { kind: "locked" }
  | { kind: "invalid" };

/**
 * Verifies credentials with a simple lockout: after MAX_FAILED_ATTEMPTS
 * consecutive failures, the account is locked for LOCK_MINUTES.
 */
export async function attemptLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const account = await getAccountByEmail(email);
  if (!account) {
    return { kind: "invalid" };
  }

  if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
    return { kind: "locked" };
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    const attempts = account.failedAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = lock
      ? new Date(Date.now() + LOCK_MINUTES * 60_000)
      : null;
    await sql`
      update accounts
      set failed_attempts = ${lock ? 0 : attempts},
          locked_until = ${lockedUntil},
          updated_at = now()
      where id = ${account.id}
    `;
    return { kind: "invalid" };
  }

  await sql`
    update accounts
    set failed_attempts = 0, locked_until = null, updated_at = now()
    where id = ${account.id}
  `;

  return { kind: "ok", account };
}

export async function changePassword(accountId: string, newPassword: string) {
  const hash = await hashPassword(newPassword);
  const rows = await sql<{ token_version: number }[]>`
    update accounts
    set password_hash = ${hash},
        must_change_password = false,
        token_version = token_version + 1,
        updated_at = now()
    where id = ${accountId}
    returning token_version
  `;
  return rows[0]?.token_version ?? 0;
}

/**
 * Returns true if the account still exists and its token_version matches —
 * used to make session revocation (tier change / disable) take effect
 * immediately instead of waiting for cookie expiry.
 */
export async function isTokenVersionCurrent(
  accountId: string,
  tokenVersion: number,
): Promise<boolean> {
  const rows = await sql<{ token_version: number }[]>`
    select token_version from accounts where id = ${accountId}
  `;
  return rows[0]?.token_version === tokenVersion;
}

export async function upsertAccount(params: {
  email: string;
  initialPassword: string;
  canViewKpis: boolean;
  canViewCaseDetail: boolean;
}) {
  const hash = await hashPassword(params.initialPassword);
  await sql`
    insert into accounts (email, password_hash, can_view_kpis, can_view_case_detail)
    values (${params.email.toLowerCase()}, ${hash}, ${params.canViewKpis}, ${params.canViewCaseDetail})
    on conflict (email) do update
      set password_hash = excluded.password_hash,
          can_view_kpis = excluded.can_view_kpis,
          can_view_case_detail = excluded.can_view_case_detail,
          must_change_password = true,
          token_version = accounts.token_version + 1,
          updated_at = now()
  `;
}
