import { ReportLookupForm } from "@/components/ReportLookupForm";

export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#1B365D] dark:text-blue-400 mb-4 tracking-tighter">
            Portal de Reportes de Seguridad
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-lg">
            Consulta de estatus
          </p>
        </div>

        <ReportLookupForm />
      </div>
    </div>
  );
}
