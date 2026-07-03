export interface EstadoInfo {
  raw: string | null;
  label: string;
  colorClass: string;
}

const ESTADO_MAP: Record<string, Omit<EstadoInfo, "raw">> = {
  Nuevo: {
    label: "Nuevo",
    colorClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  "En proceso": {
    label: "En proceso",
    colorClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  "Pendiente de Información": {
    label: "Pendiente de información",
    colorClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  "Pendiente de Acciones": {
    label: "Pendiente de acciones",
    colorClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  "En Proceso de Cierre": {
    label: "En proceso de cierre",
    colorClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  },
  Cerrado: {
    label: "Cerrado",
    colorClass:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
};

const DEFAULT_ESTADO: Omit<EstadoInfo, "raw"> = {
  label: "Recibido — en revisión inicial",
  colorClass:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/**
 * Falls back to a generic "received" label whenever the status is empty or
 * an unrecognized value, so a new status added in Airtable later (without a
 * matching code deploy) never renders as blank/undefined.
 */
export function mapEstado(raw: string | null): EstadoInfo {
  const info = raw ? (ESTADO_MAP[raw] ?? DEFAULT_ESTADO) : DEFAULT_ESTADO;
  return { raw, ...info };
}
