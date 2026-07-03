import { fetchReportByCode } from "@/lib/airtable";
import { parseReportCode } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo: rawCodigo } = await params;
  const codigo = parseReportCode(decodeURIComponent(rawCodigo));

  if (!codigo) {
    return Response.json(
      {
        error: "codigo_invalido",
        message:
          "El código ingresado no tiene el formato correcto. Verifique e intente de nuevo (ej. PUJ-020820251835).",
      },
      { status: 400 },
    );
  }

  const outcome = await fetchReportByCode(codigo);

  if (outcome.kind === "upstream_error") {
    return Response.json(
      {
        error: "error_upstream",
        message:
          "No pudimos conectar con el sistema de reportes en este momento. Intente de nuevo en unos minutos.",
      },
      { status: 502 },
    );
  }

  if (outcome.kind === "not_found") {
    return Response.json(
      {
        error: "no_encontrado",
        message:
          "No se encontró ningún reporte con ese código. Verifique que lo haya escrito correctamente.",
      },
      { status: 404 },
    );
  }

  return Response.json(outcome.report, { status: 200 });
}
