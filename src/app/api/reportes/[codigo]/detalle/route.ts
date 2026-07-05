import { requireSession } from "@/lib/auth/requireSession";
import { fetchReportDetailByCode } from "@/lib/airtable-detail";
import { parseReportCode } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await requireSession({ canViewCaseDetail: true });
  if (!session) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  const { codigo: rawCodigo } = await params;
  const codigo = parseReportCode(decodeURIComponent(rawCodigo));
  if (!codigo) {
    return Response.json({ message: "Código inválido." }, { status: 400 });
  }

  const outcome = await fetchReportDetailByCode(codigo);

  if (outcome.kind === "upstream_error") {
    return Response.json(
      { message: "No se pudo conectar con Airtable en este momento." },
      { status: 502 },
    );
  }

  if (outcome.kind === "not_found") {
    return Response.json({ message: "Reporte no encontrado." }, { status: 404 });
  }

  return Response.json(outcome.detail);
}
