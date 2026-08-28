import Link from 'next/link'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  // Nombre de signalements non traités
  const pendingReports = await prisma.signalement.count({
    where: { statut: 'nouveau' },
  })

  // Nombre de suggestions non lues
  const unreadSuggestions = await prisma.suggestion.count({
    where: { statut: 'nouveau' },
  })

  const navItems = [
    { label: 'Tableau de bord', href: '/admin', icon: '📊' },
    { label: 'Arborescence', href: '/admin/hierarchie', icon: '📂' },
    { label: 'Gestion des Questions', href: '/admin/questions', icon: '📝' },
    { label: 'Examens Officiels', href: '/admin/examens', icon: '🎓' },
    { label: 'Import JSON', href: '/admin/import', icon: '📥' },
    { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: '👥' },
    { label: 'Signalements', href: '/admin/signalements', icon: '🚩', badge: pendingReports },
    { label: 'Statistiques & Idées', href: '/admin/statistiques', icon: '💡', badge: unreadSuggestions },
    { label: 'Difficulté Questions', href: '/admin/stats-questions', icon: '🎯' },
    { label: 'Accès Premium', href: '/admin/premium', icon: '💎' },
    { label: 'Doublons', href: '/admin/doublons', icon: '🔍' },
  ]

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
      {/* Sidebar Navigation Admin */}
      <aside className="w-full md:w-64 shrink-0 space-y-2">
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-2xl">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Espace Administration
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
            {user.prenom} {user.nom}
          </div>
        </div>

        <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 shadow-xs">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300 transition"
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {!!item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Contenu Principal Admin */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
