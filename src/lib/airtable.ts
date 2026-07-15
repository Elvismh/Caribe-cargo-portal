import { mapEstado, mapCaseEstado, type EstadoInfo } from "./statusLabels";
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
// Linked-record fields — only ever used to fetch the record IDs of the
// case(s) this report was routed to, so we can pull their (also
// non-sensitive) status + running-update fields. Never used to expose
// anything about the linked records beyond that.
const FIELD_ID_LINK_SMS = "fldJwRSMKO4T6SOcZ";
const FIELD_ID_LINK_SOP = "fldm0M0BikA0mu19T";
const FIELD_ID_LINK_CSI = "fldu7E8cCEn2o8JVD";

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
  FIELD_ID_LINK_SMS,
  FIELD_ID_LINK_SOP,
  FIELD_ID_LINK_CSI,
];

// Case tables. Only the case's own status + its "Actualizaciones del caso"
// running-log field are ever read here — never the sensitive fields that
// live on these same tables (those are only exposed via the separate,
// session-gated src/lib/airtable-detail.ts).
const CASE_TABLES: Record<
  "SMS" | "SOP" | "CSI",
  { tableId: string; estadoFieldId: string; actualizacionesFieldId: string }
> = {
  SMS: {
    tableId: "tblFNdpPAaMrbotBS",
    estadoFieldId: "fld0GgRksSioZiz6S",
    actualizacionesFieldId: "fldTCzIi1RfLE5vts",
  },
  SOP: {
    tableId: "tbl4obI5Tcv45J712",
    estadoFieldId: "fldkL2bJBAW96L2Y8",
    actualizacionesFieldId: "fldb2DxGn7IVPfx22",
  },
  CSI: {
    tableId: "tblQUSiAGWK6rvwHN",
    estadoFieldId: "fldLZTAlmwpqlAU1e",
    actualizacionesFieldId: "fldJiwKQGdbjOJEWY",
  },
};

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

export interface CasoStatus {
  tipo: "SMS" | "SOP" | "CSI";
  estado: EstadoInfo;
  actualizaciones: string | null;
}

export interface ReportLookupResult {
  codigo: string;
  estacion: string | null;
  tipoReporte: string | null;
  fechaSuceso: string | null;
  estado: EstadoInfo;
  fechaCierre: string | null;
  notas: string | null;
  casos: CasoStatus[];
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

function firstLinkedRecordId(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return typeof value[0] === "string" ? value[0] : null;
}

/**
 * Fetches a single case record by ID, restricted to the case-level status
 * and running-update fields only (see CASE_TABLES above). Returns null on
 * any error — a missing/unreachable case status should never break the
 * whole report lookup, it just gets omitted from `casos`.
 */
async function fetchCasoStatus(
  tipo: "SMS" | "SOP" | "CSI",
  recordId: string,
  token: string,
): Promise<CasoStatus | null> {
  const { tableId, estadoFieldId, actualizacionesFieldId } = CASE_TABLES[tipo];
  const params = new URLSearchParams();
  params.append("fields[]", estadoFieldId);
  params.append("fields[]", actualizacionesFieldId);
  params.set("returnFieldsByFieldId", "true");
  params.set("maxRecords", "1");
  // Airtable's single-record "retrieve" endpoint (GET .../{tableId}/{recordId})
  // doesn't support fields[]/returnFieldsByFieldId (returns 422) — use the
  // list endpoint filtered to this exact record ID instead, which does.
  params.set("filterByFormula", `RECORD_ID() = "${recordId}"`);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Airtable case fetch (${tipo}) responded with error`, res.status);
      return null;
    }
    const data = (await res.json()) as AirtableListResponse;
    const record = data.records?.[0];
    if (!record) return null;
    const estadoRaw = firstValue(record.fields[estadoFieldId]);
    const actualizacionesRaw = record.fields[actualizacionesFieldId];
    return {
      tipo,
      estado: mapCaseEstado(estadoRaw),
      actualizaciones:
        typeof actualizacionesRaw === "string"
          ? sanitizeNotes(actualizacionesRaw)
          : null,
    };
  } catch (err) {
    console.error(`Airtable case fetch (${tipo}) threw`, err);
    return null;
  }
}

function tipoReporteLabel(casos: CasoStatus[], fallback: string | null): string | null {
  if (casos.length === 0) return fallback;
  return casos.map((c) => c.tipo).join(" y ");
}

async function toReport(
  record: AirtableRecord,
  token: string,
): Promise<ReportLookupResult> {
  const f = record.fields;
  const estadoRaw = firstValue(f[FIELD_ID_ESTADO]);
  const notasRaw = f[FIELD_ID_NOTAS];

  const linkedCaseFetches: Promise<CasoStatus | null>[] = [];
  const smsId = firstLinkedRecordId(f[FIELD_ID_LINK_SMS]);
  const sopId = firstLinkedRecordId(f[FIELD_ID_LINK_SOP]);
  const csiId = firstLinkedRecordId(f[FIELD_ID_LINK_CSI]);
  if (smsId) linkedCaseFetches.push(fetchCasoStatus("SMS", smsId, token));
  if (sopId) linkedCaseFetches.push(fetchCasoStatus("SOP", sopId, token));
  if (csiId) linkedCaseFetches.push(fetchCasoStatus("CSI", csiId, token));

  const casos = (await Promise.all(linkedCaseFetches)).filter(
    (c): c is CasoStatus => c !== null,
  );

  return {
    codigo: typeof f[FIELD_ID_REPORTE] === "string" ? f[FIELD_ID_REPORTE] : "",
    estacion: typeof f[FIELD_ID_ESTACION] === "string" ? f[FIELD_ID_ESTACION] : null,
    tipoReporte: tipoReporteLabel(
      casos,
      typeof f[FIELD_ID_TIPO] === "string" ? f[FIELD_ID_TIPO] : null,
    ),
    fechaSuceso:
      typeof f[FIELD_ID_FECHA_SUCESO] === "string" ? f[FIELD_ID_FECHA_SUCESO] : null,
    estado: mapEstado(estadoRaw),
    fechaCierre:
      typeof f[FIELD_ID_FECHA_CIERRE] === "string" ? f[FIELD_ID_FECHA_CIERRE] : null,
    notas: typeof notasRaw === "string" ? sanitizeNotes(notasRaw) : null,
    casos,
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
  // Without this, Airtable keys the response `fields` object by field
  // *name* even when the request used field IDs — toReport() below reads
  // by field ID, so this must stay in sync with that.
  params.set("returnFieldsByFieldId", "true");
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

  return { kind: "found", report: await toReport(record, token) };
}
