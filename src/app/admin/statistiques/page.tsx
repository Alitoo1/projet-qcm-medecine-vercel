import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminStatistiquesPage() {
  await requireAdmin()

  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
  })

  const totalUsers = await prisma.user.count()
  const totalScores = await prisma.score.count()

  // 7 derniers jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentScores = await prisma.score.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  })

  async function markSuggestionRead(id: number) {
    'use server'
    await requireAdmin()
    await prisma.suggestion.update({
      where: { id },
      data: { statut: 'lu' },
    })
    revalidatePath('/admin/statistiques')
  }

  async function deleteSuggestion(id: number) {
    'use server'
    await requireAdmin()
    await prisma.suggestion.delete({ where: { id } })
    revalidatePath('/admin/statistiques')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Statistiques d&apos;usage & Boîte à suggestions
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Activité de la plateforme et retours des étudiants
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400">Total Étudiants</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalUsers}</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400">Tentatives totales</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalScores}</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400">Tentatives (7 derniers jours)</div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{recentScores}</div>
        </div>
      </div>

      {/* Boîte à suggestions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          💡 Suggestions reçues ({suggestions.length})
        </h2>

        {suggestions.length === 0 ? (
          <p className="text-xs text-slate-400">Aucune suggestion pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.statut === 'nouveau'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {s.statut.toUpperCase()}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.user.prenom} {s.user.nom} ({s.user.email})
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {s.contenu}
                </p>

                <div className="flex justify-end gap-2 pt-1">
                  {s.statut === 'nouveau' && (
                    <form action={markSuggestionRead.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold cursor-pointer"
                      >
                        ✓ Marquer comme lu
                      </button>
                    </form>
                  )}
                  <form action={deleteSuggestion.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
