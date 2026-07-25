// ELEVATED ACCESS: this module intentionally exposes sensitive fields
// (reporter identity, evidence attachments, root cause, responsible
// parties, and the full case-level detail for SMS/SOP/CSI cases). Every
// caller of fetchReportDetailByCode() MUST be gated by
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
const FIELD_ID_RESPONSABLE_NOMBRE = "fldAYWPpsxPhh5FYR";
const FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE = "fldd559p8rNUKCWjE";
const FIELD_ID_PLAN_ACCION = "fldzqL5S9NrDx6AZl";
const FIELD_ID_PRUEBAS_CIERRE = "fldwR10HQiyAzrpzn";
const FIELD_ID_RCA = "fldSViCNuqLRkcBC7";
const FIELD_ID_LINK_SMS = "fldJwRSMKO4T6SOcZ";
const FIELD_ID_LINK_SOP = "fldm0M0BikA0mu19T";
const FIELD_ID_LINK_CSI = "fldu7E8cCEn2o8JVD";

const ELEVATED_ALLOWED_FIELD_IDS = [
  FIELD_ID_REPORTE,
  FIELD_ID_DESCRIPCION,
  FIELD_ID_EVIDENCIAS,
  FIELD_ID_CONFIDENCIAL,
  FIELD_ID_RESPONSABLE_NOMBRE,
  FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE,
  FIELD_ID_PLAN_ACCION,
  FIELD_ID_PRUEBAS_CIERRE,
  FIELD_ID_RCA,
  FIELD_ID_LINK_SMS,
  FIELD_ID_LINK_SOP,
  FIELD_ID_LINK_CSI,
];

const TABLE_ID_SMS = "tblFNdpPAaMrbotBS";
const TABLE_ID_SOP = "tbl4obI5Tcv45J712";
const TABLE_ID_CSI = "tblQUSiAGWK6rvwHN";

const SMS_FIELDS = {
  id: "fldpP5oK0rtgoScbW",
  fechaApertura: "fldqhb8MGVtbG7RJL",
  peligroIdentificado: "fldn9mCTqRUcnIq7D",
  descripcionTecnica: "fldL3buiNktsgHpXp",
  justificacion: "fldLoiSSIv1dqrHin",
  tipoEvento: "fldmW44URK0uR8PHA",
  estado: "fld0GgRksSioZiz6S",
  controlesExistentes: "fldt4wloRs2MU8FvK",
  consecuenciaCreible: "fldPDAvEfcoMlCfdu",
  severidad: "fldrqTstgQsJahr2p",
  probabilidad: "fldyBOl3lohVFINSu",
  mitigaciones: "fld4ImH9MuwHjQcnX",
  fechaCierre: "fldV05fBTyvWMeMRm",
  leccionAprendida: "fldkzvUWWcIj9zotI",
  riesgoResidual: "fldzkDZ7jfnu2jaTO",
  evidenciaEfectividad: "fldffQsBTPMMtHlGa",
  actualizaciones: "fldTCzIi1RfLE5vts",
} as const;

const SOP_FIELDS = {
  id: "fld9SiaYesvgGbomY",
  fechaApertura: "fld4uKJGVHZcz4Zr5",
  descripcionTecnica: "fldQsFfAZMTYSeKrZ",
  consecuencias: "fld6PE9WQuea06RTF",
  justificacion: "fldDVHuxq9Y1lV0se",
  procedimientoAfectado: "fldqKCDMHLa2eAFgg",
  tipoDesviacion: "fldrNO9vGrn5FMZAQ",
  incumplioProcedimiento: "fldjk8Dd8H0kBN4EI",
  tipoIncumplimiento: "fldxuoe5W5WQY9PTL",
  causaOperativa: "fldXHhiUc6dAiJ20G",
  estado: "fldkL2bJBAW96L2Y8",
  accionesCorrectivas: "fld3OHJlB5PO5PXoC",
  evidenciaCierre: "fldlVNB1rJQkaK2X5",
  fechaCierre: "fldGHmdg98hHnp73U",
  actualizaciones: "fldb2DxGn7IVPfx22",
} as const;

const CSI_FIELDS = {
  id: "fld7uTFeBjQZQhSJ9",
  fechaInspeccion: "fld7gj6c4Pt3cVPUY",
  descripcionTecnica: "fldkIW0oMZbGy5cQL",
  activosAfectados: "fldIMIeamh52iMiUi",
  criticidadActivo: "fldKxC9WBXptaGvbB",
  esRecurrente: "fldavLslbhB1UMuRo",
  resultado: "fldtpgBksyRv3eXPD",
  estado: "fldLZTAlmwpqlAU1e",
  observaciones: "fldKphIAbWtWoT1Uo",
  accionesCorrectivas: "fldLL6Mls3cZdozKS",
  pruebas: "fldgkp463j3Q0kDZQ",
  fechaCierre: "fld6x4eMa2SrTP4pd",
  actualizaciones: "fldJiwKQGdbjOJEWY",
} as const;

function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  thumbnails?: { large?: { url: string } };
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
  evidencias: { url: string; filename: string; thumbnailUrl: string | null }[];
  confidencial: boolean;
  responsable: string | null;
  responsableSeguimiento: string | null;
  planAccion: string | null;
  pruebasCierre: { url: string; filename: string }[];
  causaRaiz: string | null;
  casoSms: CasoSmsDetail | null;
  casoSop: CasoSopDetail | null;
  casoCsi: CasoCsiDetail | null;
}

export interface CasoSmsDetail {
  id: string | null;
  fechaApertura: string | null;
  peligroIdentificado: string | null;
  descripcionTecnica: string | null;
  justificacion: string | null;
  tipoEvento: string | null;
  estado: string | null;
  controlesExistentes: string | null;
  consecuenciaCreible: string | null;
  severidad: string | null;
  probabilidad: string | null;
  mitigaciones: string | null;
  fechaCierre: string | null;
  leccionAprendida: string | null;
  riesgoResidual: string | null;
  evidenciaEfectividad: { url: string; filename: string }[];
  actualizaciones: string | null;
}

export interface CasoSopDetail {
  id: string | null;
  fechaApertura: string | null;
  descripcionTecnica: string | null;
  consecuencias: string | null;
  justificacion: string | null;
  procedimientoAfectado: string | null;
  tipoDesviacion: string[];
  incumplioProcedimiento: string | null;
  tipoIncumplimiento: string | null;
  causaOperativa: string | null;
  estado: string | null;
  accionesCorrectivas: string | null;
  evidenciaCierre: { url: string; filename: string }[];
  fechaCierre: string | null;
  actualizaciones: string | null;
}

export interface CasoCsiDetail {
  id: string | null;
  fechaInspeccion: string | null;
  descripcionTecnica: string | null;
  activosAfectados: string[];
  criticidadActivo: string | null;
  esRecurrente: string | null;
  resultado: string | null;
  estado: string | null;
  observaciones: string | null;
  accionesCorrectivas: { url: string; filename: string }[];
  pruebas: { url: string; filename: string }[];
  fechaCierre: string | null;
  actualizaciones: string | null;
}

export type FetchDetailOutcome =
  | { kind: "found"; detail: ReportDetailResult }
  | { kind: "not_found" }
  | { kind: "upstream_error" };

function firstValue(value: unknown): string | null {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
}

function firstLinkedRecordId(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return typeof value[0] === "string" ? value[0] : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function attachments(value: unknown): { url: string; filename: string }[] {
  if (!Array.isArray(value)) return [];
  return (value as AirtableAttachment[])
    .filter((a) => typeof a?.url === "string")
    .map((a) => ({ url: a.url, filename: a.filename ?? "archivo" }));
}

// Only used for the intake "Evidencias" field, which renders as an inline
// thumbnail gallery rather than a plain filename link — the other
// attachment fields (Pruebas de cierre, Evidencia de cierre SOP/SMS, etc.)
// keep using attachments() above unchanged.
function attachmentsWithThumbnails(
  value: unknown,
): { url: string; filename: string; thumbnailUrl: string | null }[] {
  if (!Array.isArray(value)) return [];
  return (value as AirtableAttachment[])
    .filter((a) => typeof a?.url === "string")
    .map((a) => ({
      url: a.url,
      filename: a.filename ?? "archivo",
      thumbnailUrl: a.thumbnails?.large?.url ?? null,
    }));
}

function textOrNull(value: unknown, sanitize = false): string | null {
  if (typeof value !== "string") return null;
  return sanitize ? sanitizeNotes(value) : value;
}

async function fetchCaseRecord(
  tableId: string,
  recordId: string,
  fieldIds: string[],
  token: string,
): Promise<AirtableRecord | null> {
  const params = new URLSearchParams();
  fieldIds.forEach((id) => params.append("fields[]", id));
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
      console.error("Airtable case-detail fetch responded with error", tableId, res.status);
      return null;
    }
    const data = (await res.json()) as AirtableListResponse;
    return data.records?.[0] ?? null;
  } catch (err) {
    console.error("Airtable case-detail fetch threw", tableId, err);
    return null;
  }
}

async function fetchCasoSms(recordId: string, token: string): Promise<CasoSmsDetail | null> {
  const record = await fetchCaseRecord(TABLE_ID_SMS, recordId, Object.values(SMS_FIELDS), token);
  if (!record) return null;
  const f = record.fields;
  return {
    id: textOrNull(f[SMS_FIELDS.id]),
    fechaApertura: textOrNull(f[SMS_FIELDS.fechaApertura]),
    peligroIdentificado: textOrNull(f[SMS_FIELDS.peligroIdentificado]),
    descripcionTecnica: textOrNull(f[SMS_FIELDS.descripcionTecnica], true),
    justificacion: textOrNull(f[SMS_FIELDS.justificacion], true),
    tipoEvento: firstValue(f[SMS_FIELDS.tipoEvento]),
    estado: firstValue(f[SMS_FIELDS.estado]),
    controlesExistentes: textOrNull(f[SMS_FIELDS.controlesExistentes], true),
    consecuenciaCreible: textOrNull(f[SMS_FIELDS.consecuenciaCreible], true),
    severidad: firstValue(f[SMS_FIELDS.severidad]),
    probabilidad: firstValue(f[SMS_FIELDS.probabilidad]),
    mitigaciones: textOrNull(f[SMS_FIELDS.mitigaciones]),
    fechaCierre: textOrNull(f[SMS_FIELDS.fechaCierre]),
    leccionAprendida: textOrNull(f[SMS_FIELDS.leccionAprendida]),
    riesgoResidual: textOrNull(f[SMS_FIELDS.riesgoResidual]),
    evidenciaEfectividad: attachments(f[SMS_FIELDS.evidenciaEfectividad]),
    actualizaciones: textOrNull(f[SMS_FIELDS.actualizaciones], true),
  };
}

async function fetchCasoSop(recordId: string, token: string): Promise<CasoSopDetail | null> {
  const record = await fetchCaseRecord(TABLE_ID_SOP, recordId, Object.values(SOP_FIELDS), token);
  if (!record) return null;
  const f = record.fields;
  return {
    id: textOrNull(f[SOP_FIELDS.id]),
    fechaApertura: textOrNull(f[SOP_FIELDS.fechaApertura]),
    descripcionTecnica: textOrNull(f[SOP_FIELDS.descripcionTecnica], true),
    consecuencias: textOrNull(f[SOP_FIELDS.consecuencias], true),
    justificacion: textOrNull(f[SOP_FIELDS.justificacion], true),
    procedimientoAfectado: textOrNull(f[SOP_FIELDS.procedimientoAfectado], true),
    tipoDesviacion: stringArray(f[SOP_FIELDS.tipoDesviacion]),
    incumplioProcedimiento: firstValue(f[SOP_FIELDS.incumplioProcedimiento]),
    tipoIncumplimiento: textOrNull(f[SOP_FIELDS.tipoIncumplimiento], true),
    causaOperativa: textOrNull(f[SOP_FIELDS.causaOperativa]),
    estado: firstValue(f[SOP_FIELDS.estado]),
    accionesCorrectivas: textOrNull(f[SOP_FIELDS.accionesCorrectivas], true),
    evidenciaCierre: attachments(f[SOP_FIELDS.evidenciaCierre]),
    fechaCierre: textOrNull(f[SOP_FIELDS.fechaCierre]),
    actualizaciones: textOrNull(f[SOP_FIELDS.actualizaciones], true),
  };
}

async function fetchCasoCsi(recordId: string, token: string): Promise<CasoCsiDetail | null> {
  const record = await fetchCaseRecord(TABLE_ID_CSI, recordId, Object.values(CSI_FIELDS), token);
  if (!record) return null;
  const f = record.fields;
  return {
    id: textOrNull(f[CSI_FIELDS.id]),
    fechaInspeccion: textOrNull(f[CSI_FIELDS.fechaInspeccion]),
    descripcionTecnica: textOrNull(f[CSI_FIELDS.descripcionTecnica], true),
    activosAfectados: stringArray(f[CSI_FIELDS.activosAfectados]),
    criticidadActivo: firstValue(f[CSI_FIELDS.criticidadActivo]),
    esRecurrente: firstValue(f[CSI_FIELDS.esRecurrente]),
    resultado: firstValue(f[CSI_FIELDS.resultado]),
    estado: firstValue(f[CSI_FIELDS.estado]),
    observaciones: textOrNull(f[CSI_FIELDS.observaciones], true),
    accionesCorrectivas: attachments(f[CSI_FIELDS.accionesCorrectivas]),
    pruebas: attachments(f[CSI_FIELDS.pruebas]),
    fechaCierre: textOrNull(f[CSI_FIELDS.fechaCierre]),
    actualizaciones: textOrNull(f[CSI_FIELDS.actualizaciones], true),
  };
}

async function toDetail(record: AirtableRecord, token: string): Promise<ReportDetailResult> {
  const f = record.fields;

  const smsId = firstLinkedRecordId(f[FIELD_ID_LINK_SMS]);
  const sopId = firstLinkedRecordId(f[FIELD_ID_LINK_SOP]);
  const csiId = firstLinkedRecordId(f[FIELD_ID_LINK_CSI]);

  const [casoSms, casoSop, casoCsi] = await Promise.all([
    smsId ? fetchCasoSms(smsId, token) : Promise.resolve(null),
    sopId ? fetchCasoSop(sopId, token) : Promise.resolve(null),
    csiId ? fetchCasoCsi(csiId, token) : Promise.resolve(null),
  ]);

  return {
    codigo: typeof f[FIELD_ID_REPORTE] === "string" ? f[FIELD_ID_REPORTE] : "",
    descripcion:
      typeof f[FIELD_ID_DESCRIPCION] === "string"
        ? sanitizeNotes(f[FIELD_ID_DESCRIPCION])
        : null,
    evidencias: attachmentsWithThumbnails(f[FIELD_ID_EVIDENCIAS]),
    confidencial: f[FIELD_ID_CONFIDENCIAL] === true,
    responsable: firstValue(f[FIELD_ID_RESPONSABLE_NOMBRE]),
    responsableSeguimiento: firstValue(f[FIELD_ID_RESPONSABLE_SEGUIMIENTO_NOMBRE]),
    planAccion:
      typeof f[FIELD_ID_PLAN_ACCION] === "string"
        ? sanitizeNotes(f[FIELD_ID_PLAN_ACCION])
        : null,
    pruebasCierre: attachments(f[FIELD_ID_PRUEBAS_CIERRE]),
    causaRaiz: typeof f[FIELD_ID_RCA] === "string" ? f[FIELD_ID_RCA] : null,
    casoSms,
    casoSop,
    casoCsi,
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

  return { kind: "found", detail: await toDetail(record, token) };
}
