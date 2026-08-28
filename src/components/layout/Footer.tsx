import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-sm text-slate-500 dark:text-slate-400 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          © {year} Medix — FMP Fès / USMBA. Tous droits réservés.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/mentions-legales"
            className="hover:text-slate-900 dark:hover:text-white transition underline-offset-4 hover:underline"
          >
            Mentions légales & Confidentialité
          </Link>
          <span>•</span>
          <Link
            href="/suggestion"
            className="hover:text-teal-600 dark:hover:text-teal-400 transition"
          >
            💡 Faire une suggestion
          </Link>
        </div>
      </div>
    </footer>
  )
}
