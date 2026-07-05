"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message ?? "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }
      if (body.mustChangePassword) {
        router.push(`/cambiar-password?next=${encodeURIComponent(next)}`);
      } else {
        router.push(next);
      }
    } catch {
      setError("No se pudo conectar. Intente de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 pt-24 pb-20">
        <h1 className="text-2xl font-black text-[#1B365D] dark:text-blue-400 mb-8 text-center">
          Iniciar sesión
        </h1>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              Correo corporativo
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-white outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              Contraseña
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
