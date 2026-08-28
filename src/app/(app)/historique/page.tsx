import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { formatDuration } from '@/lib/utils'

export default async function HistoriquePage() {
  const user = await requireAuth()

  // Charger tous les scores de l'utilisateur
  const scores = await prisma.score.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      cours: true,
      module: true,
      examenOfficiel: true,
    },
  })

  // Métriques
  const totalAttempts = scores.length
  const nonRevisionScores = scores.filter((s) => s.mode !== 'revision')
  const avgPercentage =
    nonRevisionScores.length > 0
      ? Math.round(
          (nonRevisionScores.reduce((acc, s) => acc + Number(s.pourcentage), 0) /
            nonRevisionScores.length) *
            10
        ) / 10
      : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>📊</span> Historique & Statistiques
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Suivez votre progression et vos scores détaillés
        </p>
      </div>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total des entraînements
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalAttempts} session{totalAttempts > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Moyenne générale (hors révisions)
          </div>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
            {avgPercentage}%
          </div>
        </div>
      </div>

      {/* Tableau des tentatives */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Sessions récentes
          </h2>
        </div>

        {scores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucun historique d&apos;entraînement pour le moment. Lancez un premier quiz !
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Matière / Épreuve</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Pourcentage</th>
                  <th className="p-4">Durée</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scores.map((s) => {
                  const dateFormatted = new Date(s.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  const titre =
                    s.examenOfficiel?.titre ||
                    s.cours?.titre ||
                    (s.module ? `Examen blanc : ${s.module.nom}` : 'Entraînement')

                  let erreursCount = 0
                  try {
                    erreursCount = s.erreursIds ? JSON.parse(s.erreursIds).length : 0
                  } catch {}

                  const pct = Number(s.pourcentage)
                  let pctBadge = 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  if (pct >= 75) pctBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  else if (pct >= 50) pctBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4 text-slate-500 whitespace-nowrap">{dateFormatted}</td>
                      <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {titre}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {s.mode}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {s.score} / {s.total}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[11px] ${pctBadge}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {s.dureeSecondes ? formatDuration(s.dureeSecondes) : '—'}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {s.reponsesData && (
                          <Link
                            href={`/copie?score_id=${s.id}`}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold text-[11px] transition"
                          >
                            📄 Copie
                          </Link>
                        )}
                        {erreursCount > 0 && (
                          <Link
                            href={`/quiz?revision=${s.id}`}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-semibold text-[11px] transition"
                          >
                            🔁 Réviser ({erreursCount})
                          </Link>
                        )}
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
