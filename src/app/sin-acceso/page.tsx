import Link from "next/link";

export default function SinAccesoPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-lg mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-2xl font-black text-[#1B365D] dark:text-white mb-4">
          Acceso restringido
        </h1>
        <p className="text-slate-600 dark:text-slate-200 mb-8">
          Tu cuenta no tiene permiso para ver esta sección. Si crees que esto
          es un error, contacta al departamento de Safety.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#1B365D] dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
