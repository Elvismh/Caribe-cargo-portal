"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message ?? "No se pudo cambiar la contraseña.");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("No se pudo conectar. Intente de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 pt-24 pb-20">
        <h1 className="text-2xl font-black text-[#1B365D] dark:text-white mb-2 text-center">
          Cambia tu contraseña
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-sm text-center mb-8">
          Es tu primer inicio de sesión. Por seguridad, debes establecer una
          contraseña nueva antes de continuar.
        </p>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              Contraseña actual
            </span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-white outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              Contraseña nueva (mínimo 8 caracteres)
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-white outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              Confirmar contraseña nueva
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-white outline-none"
            />
          </label>
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1B365D] dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
