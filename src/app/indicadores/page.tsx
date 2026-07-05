"use client";

import { useEffect, useState } from "react";
import type { KpiDashboard } from "@/lib/airtable-kpis";
import { BigNumberCard } from "@/components/kpis/BigNumberCard";
import { DistributionCard } from "@/components/kpis/DistributionCard";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: KpiDashboard };

function pct(n: number): string {
  return `${n.toFixed(0)}%`;
}

function days(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(1)} días`;
}

export default function IndicadoresPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    fetch("/api/kpis")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: body?.message ?? "Error." });
          return;
        }
        setState({ status: "ready", data: body as KpiDashboard });
      })
      .catch(() =>
        setState({ status: "error", message: "No se pudo conectar." }),
      );
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-3xl font-black text-[#1B365D] dark:text-white mb-2 tracking-tight">
          Indicadores de Seguridad (KSPI)
        </h1>
        <p className="text-slate-500 dark:text-slate-300 mb-10">
          Resumen operativo — Sistema de Gestión de Seguridad (SMS)
        </p>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <BigNumberCard
              title="Reportes SMS del mes"
              value={String(state.data.totalReportesSmsDelMes)}
              subtitle="Meta SMM: tendencia creciente"
            />
            <BigNumberCard
              title="Promedio días de cierre SMS"
              value={days(state.data.promedioDiasCierreSms)}
              subtitle="Meta: ≤ 20 días"
            />
            <BigNumberCard
              title="Acciones correctivas SMS implementadas"
              value={pct(state.data.porcentajeAccionesCorrectivasSms)}
              subtitle="Meta: ≥ 90%"
            />
            <BigNumberCard
              title="Índice de severidad promedio"
              value={
                state.data.indiceSeveridadPromedio === null
                  ? "—"
                  : state.data.indiceSeveridadPromedio.toFixed(1)
              }
              subtitle="Escala 0 (S0) – 5 (S5). Meta: ≤ 5"
            />
            <BigNumberCard
              title="Acciones correctivas SOP implementadas"
              value={pct(state.data.porcentajeAccionesCorrectivasSop)}
              subtitle="Meta: ≥ 80%"
            />
            <BigNumberCard
              title="Daños recurrentes sin solución"
              value={String(state.data.danosRecurrentesSinSolucion)}
            />
            <BigNumberCard
              title="Auditorías planificadas"
              value={String(state.data.totalAuditoriasPlanificadas)}
            />
            <BigNumberCard
              title="Auditorías realizadas / en curso"
              value={String(state.data.auditoriasRealizadasEnCurso)}
            />
            <BigNumberCard
              title="Capacitaciones planificadas"
              value={String(state.data.totalCapacitacionesPlanificadas)}
            />
            <BigNumberCard
              title="Capacitaciones realizadas"
              value={pct(state.data.porcentajeCapacitacionesRealizadas)}
            />

            <DistributionCard
              title="Distribución por tipo de reporte (mes)"
              counts={state.data.distribucionPorTipoReporte}
            />
            <DistributionCard
              title="Distribución por severidad (SMS)"
              counts={state.data.distribucionPorSeveridad}
            />
            <DistributionCard
              title="Estado de casos SOP"
              counts={state.data.estadoCasosSop}
            />
            <DistributionCard
              title="Estado del plan de auditorías"
              counts={state.data.estadoPlanAuditorias}
            />
            <DistributionCard
              title="Tipos de capacitaciones realizadas"
              counts={state.data.tiposCapacitacionesRealizadas}
            />
          </div>
        )}
      </div>
    </div>
  );
}
