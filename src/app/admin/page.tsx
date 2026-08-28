import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [
    usersCount,
    coursCount,
    qcmCount,
    redactionCount,
    scoresCount,
    signalementsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.cours.count(),
    prisma.questionQcm.count(),
    prisma.questionRedactionnelle.count(),
    prisma.score.count(),
    prisma.signalement.count({ where: { statut: 'nouveau' } }),
  ])

  const cards = [
    { label: 'Utilisateurs inscrits', value: usersCount, icon: '👥', href: '/admin/utilisateurs' },
    { label: 'Cours créés', value: coursCount, icon: '📚', href: '/admin/hierarchie' },
    { label: 'Questions QCM', value: qcmCount, icon: '📝', href: '/admin/questions' },
    { label: 'Questions Rédactionnelles', value: redactionCount, icon: '✍️', href: '/admin/questions' },
    { label: 'Tentatives passées', value: scoresCount, icon: '📊', href: '/admin/statistiques' },
    { label: 'Signalements en attente', value: signalementsCount, icon: '🚩', href: '/admin/signalements', alert: signalementsCount > 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tableau de bord Administrateur
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Vue d&apos;ensemble de la plateforme et accès rapide aux outils de gestion
        </p>
      </div>

      {/* Grille des 6 métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Link
            key={i}
            href={c.href}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 transition group space-y-2"
          >
            <div className="flex items-center justify-between text-2xl">
              <span>{c.icon}</span>
              {c.alert && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {c.value}
            </div>
            <div className="text-xs text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition font-medium">
              {c.label} →
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
