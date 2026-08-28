import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export default async function AdminStatsQuestionsPage() {
  await requireAdmin()

  // Calculer le taux de réussite par question
  const logs = await prisma.reponseLog.groupBy({
    by: ['questionId'],
    _count: {
      _all: true,
    },
    _sum: {
      // Sous postgresql, on peut faire un count
    },
  })

  const questionStats = await Promise.all(
    logs.map(async (l) => {
      const total = l._count._all
      const correctCount = await prisma.reponseLog.count({
        where: { questionId: l.questionId, correct: true },
      })
      const successRate = total > 0 ? Math.round((correctCount / total) * 100) : 0

      const q = await prisma.questionQcm.findUnique({
        where: { id: l.questionId },
        include: { cours: true, partie: { include: { examen: true } } },
      })

      return {
        questionId: l.questionId,
        enonce: q?.enonce || 'Question supprimée',
        coursNom: q?.cours?.titre || q?.partie?.examen?.titre || '—',
        total,
        correctCount,
        successRate,
      }
    })
  )

  // Trier par taux de réussite croissant (questions les plus échouées en tête)
  questionStats.sort((a, b) => a.successRate - b.successRate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Analyse de la difficulté des questions ({questionStats.length})
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Identifiez les questions les plus échouées pour repérer d&apos;éventuelles erreurs de clé de correction
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {questionStats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Pas encore assez de réponses enregistrées pour calculer les statistiques.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Taux de réussite</th>
                  <th className="p-4">Énoncé</th>
                  <th className="p-4">Matière / Épreuve</th>
                  <th className="p-4">Tentatives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {questionStats.map((qs) => {
                  let badge = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  if (qs.successRate >= 70) badge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  else if (qs.successRate >= 40) badge = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'

                  return (
                    <tr key={qs.questionId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg font-bold text-xs ${badge}`}>
                          {qs.successRate}%
                        </span>
                      </td>
                      <td className="p-4 max-w-md font-medium text-slate-900 dark:text-white truncate">
                        {qs.enonce}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">
                        {qs.coursNom}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        {qs.correctCount} / {qs.total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
