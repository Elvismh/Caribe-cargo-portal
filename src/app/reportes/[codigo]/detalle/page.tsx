"use client";

import { use, useEffect, useState } from "react";
import type { ReportDetailResult } from "@/lib/airtable-detail";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ReportDetailResult };

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-6">
      <dt className="text-sm text-slate-400 dark:text-slate-300 mb-1">{label}</dt>
      <dd className="text-slate-700 dark:text-white whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    fetch(`/api/reportes/${encodeURIComponent(codigo)}/detalle`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: body?.message ?? "Error." });
          return;
        }
        setState({ status: "ready", data: body as ReportDetailResult });
      })
      .catch(() => setState({ status: "error", message: "No se pudo conectar." }));
  }, [codigo]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-2xl font-black text-[#1B365D] dark:text-white mb-1 tracking-tight">
          Detalle sensible del reporte
        </h1>
        <p className="text-slate-500 dark:text-slate-300 mb-8">{codigo}</p>

        {state.status === "loading" && (
          <p className="text-slate-500 dark:text-slate-300">Cargando…</p>
        )}

        {state.status === "error" && (
          <div
            role="alert"
            className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-sm"
          >
            {state.message}
          </div>
        )}

        {state.status === "ready" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
            {state.data.confidencial && (
              <div className="mb-6 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold inline-block">
                Reporte marcado como confidencial
              </div>
            )}
            <dl>
              <Field label="Reportado por" value={state.data.reportadoPor} />
              <Field label="Teléfono del reportante" value={state.data.telefonoReportante} />
              <Field label="Correo del reportante" value={state.data.correoReportante} />
              <Field label="Descripción del suceso" value={state.data.descripcion} />
              <Field label="Responsable" value={state.data.responsable} />
              <Field
                label="Responsable del seguimiento"
                value={state.data.responsableSeguimiento}
              />
              <Field label="Causa raíz (RCA)" value={state.data.causaRaiz} />
              <Field label="Plan de acción propuesto" value={state.data.planAccion} />
            </dl>

            {state.data.evidencias.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-slate-400 dark:text-slate-300 mb-2">
                  Evidencias
                </p>
                <ul className="flex flex-col gap-1">
                  {state.data.evidencias.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B365D] dark:text-blue-400 underline text-sm"
                      >
                        {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.data.pruebasCierre.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 dark:text-slate-300 mb-2">
                  Pruebas de cierre
                </p>
                <ul className="flex flex-col gap-1">
                  {state.data.pruebasCierre.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B365D] dark:text-blue-400 underline text-sm"
                      >
                        {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
