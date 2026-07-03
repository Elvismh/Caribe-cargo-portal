"use client";

import { useState } from "react";
import type { ReportLookupResult } from "@/lib/airtable";
import { ReportStatusCard } from "./ReportStatusCard";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ReportLookupResult }
  | { status: "error"; message: string };

export function ReportLookupForm() {
  const [codigo, setCodigo] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = codigo.trim();
    if (!trimmed) return;

    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/reportes/${encodeURIComponent(trimmed)}`);
      const body = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          message: body?.message ?? "Ocurrió un error. Intente de nuevo.",
        });
        return;
      }
      setState({ status: "success", data: body as ReportLookupResult });
    } catch {
      setState({
        status: "error",
        message:
          "No se pudo conectar. Verifique su conexión e intente de nuevo.",
      });
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex mb-10 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2"
      >
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ej: PUJ-020820251835"
          aria-label="Código del reporte"
          // Client-side hint only — the server independently re-validates
          // this pattern, so it is not the real security boundary.
          pattern="[A-Za-z]{2,4}-\d{12}"
          className="flex-grow px-6 py-4 outline-none bg-transparent text-slate-700 dark:text-slate-200 text-lg"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="bg-[#1B365D] dark:bg-blue-600 text-white px-10 py-4 font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {state.status === "loading" ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {state.status === "error" && (
        <div
          role="alert"
          className="mb-10 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-sm"
        >
          {state.message}
        </div>
      )}

      {state.status === "success" && <ReportStatusCard data={state.data} />}
    </div>
  );
}
