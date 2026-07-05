const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appDSjIPinS4TgaHF";

const TBL_INBOX = "tbldKTwfyG5MIZZ1N";
const TBL_SMS = "tblFNdpPAaMrbotBS";
const TBL_SOP = "tbl4obI5Tcv45J712";
const TBL_CSI = "tblQUSiAGWK6rvwHN";
const TBL_AUDITORIAS = "tblY2jJBlG9yt66fh";
const TBL_CAPACITACIONES = "tbldbZXRpGlTvxp0I";

// Field IDs, one block per table — same convention as src/lib/airtable.ts.
const INBOX_TIPO = "fldZjVWQxLnl69MIv";
const INBOX_FECHA_INGRESO = "fldxSd4HJ5IKM7O19";

const SMS_DIAS_GESTION = "fldNTwAyYhyWZg0YF";
const SMS_ACCION_IMPLEMENTADA = "fldlVUBwEq0eeDy0H";
const SMS_SEVERIDAD_NUM = "fldCRIJffbQKE02ap";
const SMS_SEVERIDAD = "fldrqTstgQsJahr2p";
const SMS_ESTADO = "fld0GgRksSioZiz6S";

const SOP_ACCION_IMPLEMENTADA = "fldFhZ7M8Jf433Z1W";
const SOP_ESTADO = "fldkL2bJBAW96L2Y8";

const CSI_RECURRENTE = "fldavLslbhB1UMuRo";
const CSI_ESTADO = "fldLZTAlmwpqlAU1e";

const AUD_ESTADO = "fldTAVhhrQYhI8pLX";

const CAP_ESTADO = "fldU71hgYLDIBtokR";
const CAP_TIPO = "fldyGrrHRV0uSwEo8";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function listAllRecords(params: {
  tableId: string;
  fieldIds: string[];
  filterByFormula?: string;
}): Promise<AirtableRecord[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN is not set");

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const searchParams = new URLSearchParams();
    params.fieldIds.forEach((id) => searchParams.append("fields[]", id));
    searchParams.set("returnFieldsByFieldId", "true");
    searchParams.set("pageSize", "100");
    if (params.filterByFormula) {
      searchParams.set("filterByFormula", params.filterByFormula);
    }
    if (offset) searchParams.set("offset", offset);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${params.tableId}?${searchParams.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

function firstOf(value: unknown): string | null {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
}

function countBy(records: AirtableRecord[], fieldId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const raw = r.fields[fieldId];
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      const label = typeof v === "string" ? v : "Sin especificar";
      counts[label] = (counts[label] ?? 0) + 1;
    }
  }
  return counts;
}

function average(records: AirtableRecord[], fieldId: string): number | null {
  const nums = records
    .map((r) => r.fields[fieldId])
    .filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function percentFilled(records: AirtableRecord[], fieldId: string): number {
  if (records.length === 0) return 0;
  const filled = records.filter((r) => {
    const v = r.fields[fieldId];
    return v !== null && v !== undefined && v !== "";
  }).length;
  return (filled / records.length) * 100;
}

function currentMonthFormula(dateFieldName: string): string {
  return `IS_SAME({${dateFieldName}}, TODAY(), 'month')`;
}

export interface KpiDashboard {
  totalReportesSmsDelMes: number;
  distribucionPorTipoReporte: Record<string, number>;
  promedioDiasCierreSms: number | null;
  porcentajeAccionesCorrectivasSms: number;
  indiceSeveridadPromedio: number | null;
  distribucionPorSeveridad: Record<string, number>;
  porcentajeAccionesCorrectivasSop: number;
  estadoCasosSop: Record<string, number>;
  danosRecurrentesSinSolucion: number;
  totalAuditoriasPlanificadas: number;
  estadoPlanAuditorias: Record<string, number>;
  auditoriasRealizadasEnCurso: number;
  totalCapacitacionesPlanificadas: number;
  porcentajeCapacitacionesRealizadas: number;
  tiposCapacitacionesRealizadas: Record<string, number>;
}

export async function getKpiDashboard(): Promise<KpiDashboard> {
  const [
    inboxThisMonth,
    smsAll,
    sopAll,
    csiAll,
    auditoriasAll,
    capacitacionesAll,
  ] = await Promise.all([
    listAllRecords({
      tableId: TBL_INBOX,
      fieldIds: [INBOX_TIPO, INBOX_FECHA_INGRESO],
      filterByFormula: currentMonthFormula("Fecha de ingreso del reporte (Sistema)"),
    }),
    listAllRecords({
      tableId: TBL_SMS,
      fieldIds: [SMS_DIAS_GESTION, SMS_ACCION_IMPLEMENTADA, SMS_SEVERIDAD_NUM, SMS_SEVERIDAD, SMS_ESTADO],
    }),
    listAllRecords({
      tableId: TBL_SOP,
      fieldIds: [SOP_ACCION_IMPLEMENTADA, SOP_ESTADO],
    }),
    listAllRecords({
      tableId: TBL_CSI,
      fieldIds: [CSI_RECURRENTE, CSI_ESTADO],
    }),
    listAllRecords({
      tableId: TBL_AUDITORIAS,
      fieldIds: [AUD_ESTADO],
    }),
    listAllRecords({
      tableId: TBL_CAPACITACIONES,
      fieldIds: [CAP_ESTADO, CAP_TIPO],
    }),
  ]);

  const smsCerrados = smsAll.filter((r) => firstOf(r.fields[SMS_ESTADO]) === "Cerrado");

  const danosRecurrentesSinSolucion = csiAll.filter((r) => {
    const recurrente = firstOf(r.fields[CSI_RECURRENTE]) === "Sí";
    const finalizado = firstOf(r.fields[CSI_ESTADO]) === "Finalizado";
    return recurrente && !finalizado;
  }).length;

  const auditoriasRealizadasEnCurso = auditoriasAll.filter((r) => {
    const estado = firstOf(r.fields[AUD_ESTADO]);
    return estado === "En Curso" || estado === "Cerrada";
  }).length;

  const capacitacionesRealizadas = capacitacionesAll.filter(
    (r) => firstOf(r.fields[CAP_ESTADO]) === "Realizada",
  ).length;

  return {
    totalReportesSmsDelMes: inboxThisMonth.filter(
      (r) => firstOf(r.fields[INBOX_TIPO]) === "SMS",
    ).length,
    distribucionPorTipoReporte: countBy(inboxThisMonth, INBOX_TIPO),
    promedioDiasCierreSms: average(smsCerrados, SMS_DIAS_GESTION),
    porcentajeAccionesCorrectivasSms: percentFilled(smsAll, SMS_ACCION_IMPLEMENTADA),
    indiceSeveridadPromedio: average(smsAll, SMS_SEVERIDAD_NUM),
    distribucionPorSeveridad: countBy(smsAll, SMS_SEVERIDAD),
    porcentajeAccionesCorrectivasSop: percentFilled(sopAll, SOP_ACCION_IMPLEMENTADA),
    estadoCasosSop: countBy(sopAll, SOP_ESTADO),
    danosRecurrentesSinSolucion,
    totalAuditoriasPlanificadas: auditoriasAll.length,
    estadoPlanAuditorias: countBy(auditoriasAll, AUD_ESTADO),
    auditoriasRealizadasEnCurso,
    totalCapacitacionesPlanificadas: capacitacionesAll.length,
    porcentajeCapacitacionesRealizadas:
      capacitacionesAll.length === 0
        ? 0
        : (capacitacionesRealizadas / capacitacionesAll.length) * 100,
    tiposCapacitacionesRealizadas: countBy(capacitacionesAll, CAP_TIPO),
  };
}
