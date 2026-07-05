import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-gray-100 dark:border-slate-800 py-5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 shrink-0">
            <Image
              src="/logo-caribe.png"
              alt="Logo Caribe Cargo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-xl text-brandBlue dark:text-blue-400 tracking-tight">
            CARIBE CARGO, S.R.L.
          </span>
        </Link>
        <nav className="flex gap-8 text-[15px] font-semibold text-slate-600 dark:text-slate-200">
          <Link
            href="/"
            className="hover:text-brandBlue dark:hover:text-blue-400 transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/indicadores"
            className="hover:text-brandBlue dark:hover:text-blue-400 transition-colors"
          >
            Indicadores
          </Link>
        </nav>
      </div>
    </header>
  );
}
