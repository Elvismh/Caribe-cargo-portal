// ELEVATED ACCESS: this module intentionally exposes sensitive fields
// (reporter identity, evidence attachments, root cause, responsible
// parties). Every caller of fetchReportDetailByCode() MUST be gated by
// requireSession({ canViewCaseDetail: true }) at the route level. Do not
// import this module from any public/unauthenticated code path, and do
// not merge its allowlist with the public one in src/lib/airtable.ts.

import { sanitizeNotes } from "./sanitizeNotes";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appDSjIPinS4TgaHF";
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID ?? "tbldKTwfyG5MIZZ1N";
const REPORT_ID_FIELD_NAME = "ID del reporte";

const FIELD_ID_REPORTE = "fldYrMQ3UN9yR8w6b";
const FIELD_ID_DESCRIPCION = "fldyvKSH4MwtFNPLQ";
const FIELD_ID_EVIDENCIAS = "fld8p30qc4QFQElg5";
const FIELD_ID_CONFIDENCIAL = "fldoQeLDZMBV8483N";
const FIELD_ID_REPORTADO_POR = "fldtiRQkIFkxaM5fc";
const FIELD_ID_TELEFONO = "flda6xVcjwxMhI2fM";
const FIELD_ID_CORREO = "fldC19fnwO7vMZ6ON";
const FIELD_ID_RESPONSABLE_NOMBRE = "fldAYWPpsxPhh5FYR";
const FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE = "fldd559p8rNUKCWjE";
const FIELD_ID_PLAN_ACCION = "fldzqL5S9NrDx6AZl";
const FIELD_ID_PRUEBAS_CIERRE = "fldwR10HQiyAzrpzn";
const FIELD_ID_RCA = "fldSViCNuqLRkcBC7";

const ELEVATED_ALLOWED_FIELD_IDS = [
  FIELD_ID_REPORTE,
  FIELD_ID_DESCRIPCION,
  FIELD_ID_EVIDENCIAS,
  FIELD_ID_CONFIDENCIAL,
  FIELD_ID_REPORTADO_POR,
  FIELD_ID_TELEFONO,
  FIELD_ID_CORREO,
  FIELD_ID_RESPONSABLE_NOMBRE,
  FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE,
  FIELD_ID_PLAN_ACCION,
  FIELD_ID_PRUEBAS_CIERRE,
  FIELD_ID_RCA,
];

function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
}

export interface ReportDetailResult {
  codigo: string;
  descripcion: string | null;
  evidencias: { url: string; filename: string }[];
  confidencial: boolean;
  reportadoPor: string | null;
  telefonoReportante: string | null;
  correoReportante: string | null;
  responsable: string | null;
  responsableSeguimiento: string | null;
  planAccion: string | null;
  pruebasCierre: { url: string; filename: string }[];
  causaRaiz: string | null;
}

export type FetchDetailOutcome =
  | { kind: "found"; detail: ReportDetailResult }
  | { kind: "not_found" }
  | { kind: "upstream_error" };

function firstValue(value: unknown): string | null {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
}

function attachments(value: unknown): { url: string; filename: string }[] {
  if (!Array.isArray(value)) return [];
  return (value as AirtableAttachment[])
    .filter((a) => typeof a?.url === "string")
    .map((a) => ({ url: a.url, filename: a.filename ?? "archivo" }));
}

function toDetail(record: AirtableRecord): ReportDetailResult {
  const f = record.fields;
  return {
    codigo: typeof f[FIELD_ID_REPORTE] === "string" ? f[FIELD_ID_REPORTE] : "",
    descripcion:
      typeof f[FIELD_ID_DESCRIPCION] === "string"
        ? sanitizeNotes(f[FIELD_ID_DESCRIPCION])
        : null,
    evidencias: attachments(f[FIELD_ID_EVIDENCIAS]),
    confidencial: f[FIELD_ID_CONFIDENCIAL] === true,
    reportadoPor:
      typeof f[FIELD_ID_REPORTADO_POR] === "string" ? f[FIELD_ID_REPORTADO_POR] : null,
    telefonoReportante:
      typeof f[FIELD_ID_TELEFONO] === "string" ? f[FIELD_ID_TELEFONO] : null,
    correoReportante:
      typeof f[FIELD_ID_CORREO] === "string" ? f[FIELD_ID_CORREO] : null,
    responsable: firstValue(f[FIELD_ID_RESPONSABLE_NOMBRE]),
    responsableSeguimiento: firstValue(f[FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE]),
    planAccion:
      typeof f[FIELD_ID_PLAN_ACCION] === "string"
        ? sanitizeNotes(f[FIELD_ID_PLAN_ACCION])
        : null,
    pruebasCierre: attachments(f[FIELD_ID_PRUEBAS_CIERRE]),
    causaRaiz: typeof f[FIELD_ID_RCA] === "string" ? f[FIELD_ID_RCA] : null,
  };
}

export async function fetchReportDetailByCode(
  codigo: string,
): Promise<FetchDetailOutcome> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("AIRTABLE_TOKEN is not set");
    return { kind: "upstream_error" };
  }

  const params = new URLSearchParams();
  ELEVATED_ALLOWED_FIELD_IDS.forEach((id) => params.append("fields[]", id));
  params.set("maxRecords", "1");
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
  if (!record) return { kind: "not_found" };

  return { kind: "found", detail: toDetail(record) };
}
