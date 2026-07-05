import { getSessionFromCookies, type SessionClaims } from "./session";
import { isTokenVersionCurrent } from "./accounts";

interface Requirement {
  canViewKpis?: boolean;
  canViewCaseDetail?: boolean;
}

/**
 * Verifies the session cookie AND re-checks token_version against the DB,
 * so a tier change/account disable takes effect immediately instead of
 * waiting for the JWT to expire. Use this in API routes for protected
 * data — middleware only checks the JWT signature/claims, this is the
 * stronger, DB-backed check for the actual sensitive fetch.
 */
export async function requireSession(
  requirement: Requirement,
): Promise<SessionClaims | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;
  if (session.mustChangePassword) return null;

  const current = await isTokenVersionCurrent(session.accountId, session.tokenVersion);
  if (!current) return null;

  if (requirement.canViewKpis && !session.canViewKpis) return null;
  if (requirement.canViewCaseDetail && !session.canViewCaseDetail) return null;

  return session;
}
