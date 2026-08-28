'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '../providers/ThemeProvider'

export function Header({ pendingReportsCount = 0 }: { pendingReportsCount?: number }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const user = session?.user

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Titre */}
        <div className="flex items-center gap-3">
          <Link href={user ? '/tableau-de-bord' : '/'} className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-teal-700 transition">
              🩺
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              QCM <span className="text-teal-600">Médecine</span>
            </span>
          </Link>
        </div>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link
                href="/tableau-de-bord"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/tableau-de-bord')
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tableau de bord
              </Link>
              <Link
                href="/historique"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/historique')
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Historique
              </Link>
              <Link
                href="/favoris"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/favoris')
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ⭐ Favoris
              </Link>

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`relative px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    pathname.startsWith('/admin')
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                >
                  Admin
                  {pendingReportsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingReportsCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <Link
                href="/mon-compte"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                👤 {user.prenom || 'Mon compte'}
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: '/connexion' })}
                className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition"
              >
                Inscription
              </Link>
            </>
          )}

          {/* Bouton Dark/Light */}
          <button
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>

        {/* Bouton Menu Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {/* Menu Mobile Repliable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
          {user ? (
            <>
              <Link
                href="/tableau-de-bord"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tableau de bord
              </Link>
              <Link
                href="/historique"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Historique
              </Link>
              <Link
                href="/favoris"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ⭐ Favoris
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  Espace Admin {pendingReportsCount > 0 && `(${pendingReportsCount} signalements)`}
                </Link>
              )}
              <Link
                href="/mon-compte"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                👤 Mon compte ({user.prenom})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/connexion' })
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-teal-600 dark:text-teal-400"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
