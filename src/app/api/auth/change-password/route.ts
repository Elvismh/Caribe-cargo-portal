import { getAccountById, changePassword } from "@/lib/auth/accounts";
import { verifyPassword } from "@/lib/auth/passwords";
import {
  getSessionFromCookies,
  signSession,
  setSessionCookie,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const MIN_LENGTH = 8;

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return Response.json({ message: "Sesión no válida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < MIN_LENGTH) {
    return Response.json(
      { message: `La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const account = await getAccountById(session.accountId);
  if (!account) {
    return Response.json({ message: "Cuenta no encontrada." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, account.passwordHash);
  if (!valid) {
    return Response.json(
      { message: "La contraseña actual no es correcta." },
      { status: 401 },
    );
  }

  const newTokenVersion = await changePassword(account.id, newPassword);

  const token = await signSession({
    accountId: account.id,
    email: account.email,
    canViewKpis: account.canViewKpis,
    canViewCaseDetail: account.canViewCaseDetail,
    mustChangePassword: false,
    tokenVersion: newTokenVersion,
  });
  await setSessionCookie(token);

  return Response.json({ ok: true });
}
