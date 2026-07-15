"use client";

import { use, useEffect, useState } from "react";
import type {
  ReportDetailResult,
  CasoSmsDetail,
  CasoSopDetail,
  CasoCsiDetail,
} from "@/lib/airtable-detail";

function EvidenceGallery({
  items,
}: {
  items: { url: string; filename: string; thumbnailUrl: string | null }[];
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="text-sm text-slate-400 dark:text-slate-300 mb-2">Evidencias</p>
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) =>
          item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={item.thumbnailUrl}
              alt={item.filename}
              onClick={() => setLightbox(item.url)}
              className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-32 h-32 flex items-center justify-center text-center text-xs px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1B365D] dark:text-blue-400 underline"
            >
              {item.filename}
            </a>
          ),
        )}
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

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

function FieldList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="mb-6">
      <dt className="text-sm text-slate-400 dark:text-slate-300 mb-1">{label}</dt>
      <dd className="text-slate-700 dark:text-white">{values.join(", ")}</dd>
    </div>
  );
}

function AttachmentList({
  label,
  items,
}: {
  label: string;
  items: { url: string; filename: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="text-sm text-slate-400 dark:text-slate-300 mb-2">{label}</p>
      <ul className="flex flex-col gap-1">
        {items.map((a, i) => (
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
  );
}

function CaseSection({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
      <h2 className="text-lg font-black text-[#1B365D] dark:text-white tracking-tight mb-6">
        {titulo}
      </h2>
      <dl>{children}</dl>
    </div>
  );
}

function CasoSmsSection({ caso }: { caso: CasoSmsDetail }) {
  return (
    <CaseSection titulo={`Caso SMS${caso.id ? ` — ${caso.id}` : ""}`}>
      <Field label="Estado SMS" value={caso.estado} />
      <Field label="Fecha de apertura" value={caso.fechaApertura} />
      <Field label="Tipo de evento SMS" value={caso.tipoEvento} />
      <Field label="Peligro identificado (Hazard)" value={caso.peligroIdentificado} />
      <Field label="Descripción técnica" value={caso.descripcionTecnica} />
      <Field label="Justificación SMS" value={caso.justificacion} />
      <Field label="Controles existentes" value={caso.controlesExistentes} />
      <Field label="Consecuencia creíble" value={caso.consecuenciaCreible} />
      <Field label="Severidad" value={caso.severidad} />
      <Field label="Probabilidad" value={caso.probabilidad} />
      <Field label="Mitigaciones / Acciones SMS" value={caso.mitigaciones} />
      <Field label="Lección aprendida" value={caso.leccionAprendida} />
      <Field label="Riesgo residual" value={caso.riesgoResidual} />
      <Field label="Fecha de cierre" value={caso.fechaCierre} />
      <Field label="Actualizaciones del caso" value={caso.actualizaciones} />
      <AttachmentList label="Evidencia de efectividad" items={caso.evidenciaEfectividad} />
    </CaseSection>
  );
}

function CasoSopSection({ caso }: { caso: CasoSopDetail }) {
  return (
    <CaseSection titulo={`Caso SOP${caso.id ? ` — ${caso.id}` : ""}`}>
      <Field label="Estado SOP" value={caso.estado} />
      <Field label="Fecha de apertura" value={caso.fechaApertura} />
      <Field label="Descripción técnica" value={caso.descripcionTecnica} />
      <Field label="Consecuencias" value={caso.consecuencias} />
      <Field label="Justificación SOP" value={caso.justificacion} />
      <Field label="Procedimiento afectado (Manual / Capítulo)" value={caso.procedimientoAfectado} />
      <FieldList label="Tipo de desviación SOP" values={caso.tipoDesviacion} />
      <Field label="¿Se incumplió un procedimiento?" value={caso.incumplioProcedimiento} />
      <Field label="Tipo de incumplimiento" value={caso.tipoIncumplimiento} />
      <Field label="Causa operativa" value={caso.causaOperativa} />
      <Field label="Acciones correctivas" value={caso.accionesCorrectivas} />
      <Field label="Fecha de cierre" value={caso.fechaCierre} />
      <Field label="Actualizaciones del caso" value={caso.actualizaciones} />
      <AttachmentList label="Evidencia de cierre SOP" items={caso.evidenciaCierre} />
    </CaseSection>
  );
}

function CasoCsiSection({ caso }: { caso: CasoCsiDetail }) {
  return (
    <CaseSection titulo={`Criterios de Seguridad de Instalaciones${caso.id ? ` — ${caso.id}` : ""}`}>
      <Field label="Estado" value={caso.estado} />
      <Field label="Fecha de inspección" value={caso.fechaInspeccion} />
      <Field label="Descripción técnica" value={caso.descripcionTecnica} />
      <FieldList label="Activos afectados" values={caso.activosAfectados} />
      <Field label="Criticidad del activo" value={caso.criticidadActivo} />
      <Field label="¿Es recurrente el daño?" value={caso.esRecurrente} />
      <Field label="Resultado" value={caso.resultado} />
      <Field label="Observaciones" value={caso.observaciones} />
      <Field label="Fecha de cierre" value={caso.fechaCierre} />
      <Field label="Actualizaciones del caso" value={caso.actualizaciones} />
      <AttachmentList label="Acciones correctivas" items={caso.accionesCorrectivas} />
      <AttachmentList label="Pruebas" items={caso.pruebas} />
    </CaseSection>
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
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              {state.data.confidencial && (
                <div className="mb-6 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold inline-block">
                  Reporte marcado como confidencial
                </div>
              )}
              <dl>
                <Field label="Responsable" value={state.data.responsable} />
                <Field
                  label="Responsable del seguimiento"
                  value={state.data.responsableSeguimiento}
                />
                <Field label="Causa raíz (RCA)" value={state.data.causaRaiz} />
                <Field label="Plan de acción propuesto" value={state.data.planAccion} />
              </dl>

              <EvidenceGallery items={state.data.evidencias} />
              <AttachmentList label="Pruebas de cierre" items={state.data.pruebasCierre} />
            </div>

            {state.data.casoSms && <CasoSmsSection caso={state.data.casoSms} />}
            {state.data.casoSop && <CasoSopSection caso={state.data.casoSop} />}
            {state.data.casoCsi && <CasoCsiSection caso={state.data.casoCsi} />}
          </>
        )}
      </div>
    </div>
  );
}
