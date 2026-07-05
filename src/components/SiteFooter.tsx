export function SiteFooter() {
  return (
    <footer className="bg-[#f9fafb] dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-800 pt-10 pb-6 mt-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
            Caribe Cargo S.R.L.
          </h4>
          <p className="text-gray-500 dark:text-slate-300">
            Portal Interno de Reportes de Seguridad
          </p>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
            Contacto
          </h4>
          <p className="text-gray-500 dark:text-slate-300 mb-1">
            Email: safety@caribecargo.net
          </p>
          <p className="text-gray-500 dark:text-slate-300">
            Tel: (809) 549-2720 ext. 726
          </p>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
            Ubicación
          </h4>
          <p className="text-gray-500 dark:text-slate-300 mb-1">
            Aeropuerto Internacional Las Américas (AILA). Depósito #5
          </p>
          <p className="text-gray-500 dark:text-slate-300">Santo Domingo, RD</p>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-slate-800 pt-6 text-center text-xs text-gray-400 dark:text-slate-400">
        <p>© Caribe Cargo S.R.L. · Uso interno</p>
        <p className="mt-1">
          Portal de Reportes de Seguridad - Acceso Restringido
        </p>
      </div>
    </footer>
  );
}
