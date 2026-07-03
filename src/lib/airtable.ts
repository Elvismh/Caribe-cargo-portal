import { mapEstado, type EstadoInfo } from "./statusLabels";
import { sanitizeNotes } from "./sanitizeNotes";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appDSjIPinS4TgaHF";
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID ?? "tbldKTwfyG5MIZZ1N";

// "ID del reporte" is a formula field; filterByFormula requires the field
// *name* (Airtable's formula grammar doesn't accept field IDs inside {}).
const REPORT_ID_FIELD_NAME = "ID del reporte";

const FIELD_ID_REPORTE = "fldYrMQ3UN9yR8w6b";
const FIELD_ID_ESTACION = "fldyHyQc9YCy55qip";
const FIELD_ID_TIPO = "fldZjVWQxLnl69MIv";
const FIELD_ID_FECHA_SUCESO = "fldwK8ZHWpBa5gEp6";
const FIELD_ID_ESTADO = "fldoG9VC7TrucoWrO";
const FIELD_ID_FECHA_CIERRE = "fldqVFs2DuPEAI5rk";
const FIELD_ID_NOTAS = "fld12YvY36bI8CEkA";

// Only these fields are ever requested from Airtable. Sensitive fields
// (reporter identity, evidence attachments, root cause, responsible parties,
// the "Confidencial" flag, internal notes) are never included here, so
// Airtable itself never returns them regardless of any bug further down.
const ALLOWED_FIELD_IDS = [
  FIELD_ID_REPORTE,
  FIELD_ID_ESTACION,
  FIELD_ID_TIPO,
  FIELD_ID_FECHA_SUCESO,
  FIELD_ID_ESTADO,
  FIELD_ID_FECHA_CIERRE,
  FIELD_ID_NOTAS,
];

function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
}

export interface ReportLookupResult {
  codigo: string;
  estacion: string | null;
  tipoReporte: string | null;
  fechaSuceso: string | null;
  estado: EstadoInfo;
  fechaCierre: string | null;
  notas: string | null;
}

export type FetchReportOutcome =
  | { kind: "found"; report: ReportLookupResult }
  | { kind: "not_found" }
  | { kind: "upstream_error" };

function firstValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }
  return typeof value === "string" ? value : null;
}

function toReport(record: AirtableRecord): ReportLookupResult {
  const f = record.fields;
  const estadoRaw = firstValue(f[FIELD_ID_ESTADO]);
  const notasRaw = f[FIELD_ID_NOTAS];

  return {
    codigo: typeof f[FIELD_ID_REPORTE] === "string" ? f[FIELD_ID_REPORTE] : "",
    estacion: typeof f[FIELD_ID_ESTACION] === "string" ? f[FIELD_ID_ESTACION] : null,
    tipoReporte: typeof f[FIELD_ID_TIPO] === "string" ? f[FIELD_ID_TIPO] : null,
    fechaSuceso:
      typeof f[FIELD_ID_FECHA_SUCESO] === "string" ? f[FIELD_ID_FECHA_SUCESO] : null,
    estado: mapEstado(estadoRaw),
    fechaCierre:
      typeof f[FIELD_ID_FECHA_CIERRE] === "string" ? f[FIELD_ID_FECHA_CIERRE] : null,
    notas: typeof notasRaw === "string" ? sanitizeNotes(notasRaw) : null,
  };
}

export async function fetchReportByCode(
  codigo: string,
): Promise<FetchReportOutcome> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("AIRTABLE_TOKEN is not set");
    return { kind: "upstream_error" };
  }

  const params = new URLSearchParams();
  ALLOWED_FIELD_IDS.forEach((id) => params.append("fields[]", id));
  params.set("maxRecords", "1");
  params.set(
    "filterByFormula",
    `{${REPORT_ID_FIELD_NAME}} = "${escapeFormulaValue(codigo)}"`,
  );

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    console.error("Airtable fetch threw", err);
    return { kind: "upstream_error" };
  }

  if (!res.ok) {
    console.error("Airtable responded with error", res.status, await res.text());
    return { kind: "upstream_error" };
  }

  const data = (await res.json()) as AirtableListResponse;
  const record = data.records?.[0];

  if (!record) {
    return { kind: "not_found" };
  }

  return { kind: "found", report: toReport(record) };
}
