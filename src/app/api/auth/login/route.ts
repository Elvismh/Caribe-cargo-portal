import { attemptLogin } from "@/lib/auth/accounts";
import { signSession, setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin requests from some clients omit Origin
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ message: "Solicitud inválida." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json(
      { message: "Correo y contraseña son requeridos." },
      { status: 400 },
    );
  }

  const result = await attemptLogin(email, password);

  if (result.kind === "locked") {
    return Response.json(
      {
        message:
          "Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente de nuevo en unos minutos.",
      },
      { status: 423 },
    );
  }

  if (result.kind === "invalid") {
    return Response.json(
      { message: "Credenciales inválidas." },
      { status: 401 },
    );
  }

  const { account } = result;
  const token = await signSession({
    accountId: account.id,
    email: account.email,
    canViewKpis: account.canViewKpis,
    canViewCaseDetail: account.canViewCaseDetail,
    mustChangePassword: account.mustChangePassword,
    tokenVersion: account.tokenVersion,
  });
  await setSessionCookie(token);

  return Response.json({
    mustChangePassword: account.mustChangePassword,
    canViewKpis: account.canViewKpis,
    canViewCaseDetail: account.canViewCaseDetail,
  });
}
