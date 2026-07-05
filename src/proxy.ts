import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "session";

interface SessionClaims {
  accountId: string;
  canViewKpis: boolean;
  canViewCaseDetail: boolean;
  mustChangePassword: boolean;
}

async function readSession(
  request: NextRequest,
): Promise<SessionClaims | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  const needsKpis = pathname.startsWith("/indicadores");
  const needsCaseDetail = /^\/reportes\/[^/]+\/detalle/.test(pathname);
  const needsChangePasswordPage = pathname.startsWith("/cambiar-password");

  if (needsChangePasswordPage) {
    if (!session) return loginRedirect(request);
    return NextResponse.next();
  }

  if (needsKpis || needsCaseDetail) {
    if (!session) return loginRedirect(request);

    if (session.mustChangePassword) {
      const url = new URL("/cambiar-password", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (needsKpis && !session.canViewKpis) {
      return NextResponse.redirect(new URL("/sin-acceso", request.url));
    }

    if (needsCaseDetail && !session.canViewCaseDetail) {
      return NextResponse.redirect(new URL("/sin-acceso", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/indicadores/:path*", "/reportes/:path*/detalle", "/cambiar-password"],
};
