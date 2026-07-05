import Link from "next/link";
import type { ReportLookupResult } from "@/lib/airtable";

function formatFecha(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("es-DO", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Santo_Domingo",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function ReportStatusCard({ data }: { data: ReportLookupResult }) {
  const fechaSuceso = formatFecha(data.fechaSuceso);
  const fechaCierre = formatFecha(data.fechaCierre);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-400 dark:text-slate-400 mb-1">
            Reporte
          </p>
          <h2 className="text-2xl font-black text-[#1B365D] dark:text-white tracking-tight">
            {data.codigo}
          </h2>
        </div>
        <span
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${data.estado.colorClass}`}
        >
          {data.estado.label}
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        {data.estacion && (
          <div>
            <dt className="text-slate-400 dark:text-slate-400 mb-1">
              Estación
            </dt>
            <dd className="font-semibold text-slate-700 dark:text-white">
              {data.estacion}
            </dd>
          </div>
        )}
        {data.tipoReporte && (
          <div>
            <dt className="text-slate-400 dark:text-slate-400 mb-1">
              Tipo de reporte
            </dt>
            <dd className="font-semibold text-slate-700 dark:text-white">
              {data.tipoReporte}
            </dd>
          </div>
        )}
        {fechaSuceso && (
          <div>
            <dt className="text-slate-400 dark:text-slate-400 mb-1">
              Fecha del suceso
            </dt>
            <dd className="font-semibold text-slate-700 dark:text-white">
              {fechaSuceso}
            </dd>
          </div>
        )}
        {fechaCierre && (
          <div>
            <dt className="text-slate-400 dark:text-slate-400 mb-1">
              Fecha de cierre
            </dt>
            <dd className="font-semibold text-slate-700 dark:text-white">
              {fechaCierre}
            </dd>
          </div>
        )}
      </dl>

      {data.notas && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-3">
            Notas de actualización
          </h3>
          <p className="text-slate-600 dark:text-slate-100 whitespace-pre-line leading-relaxed">
            {data.notas}
          </p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-right">
        <Link
          href={`/reportes/${encodeURIComponent(data.codigo)}/detalle`}
          className="text-sm font-bold text-[#1B365D] dark:text-blue-400 hover:underline"
        >
          Más información →
        </Link>
      </div>
    </div>
  );
}
