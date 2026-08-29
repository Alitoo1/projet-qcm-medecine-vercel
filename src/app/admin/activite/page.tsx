import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "À l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export default async function AdminActivitePage() {
  await requireAdmin()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Statistiques du jour
  const [activeTodayCount, scoresTodayCount, totalUsersCount] = await Promise.all([
    prisma.user.count({
      where: {
        lastActivityDate: { gte: today },
      },
    }),
    prisma.score.count({
      where: {
        createdAt: { gte: today },
      },
    }),
    prisma.user.count(),
  ])

  // 2. Flux des 40 derniers scores / sessions de révision
  const recentScores = await prisma.score.findMany({
    take: 40,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          annee: true,
          currentStreak: true,
        },
      },
      cours: {
        select: {
          titre: true,
          sousModule: {
            select: {
              nom: true,
              module: {
                select: {
                  nom: true,
                  semestre: {
                    select: { nom: true },
                  },
                },
              },
            },
          },
        },
      },
      examenOfficiel: {
        select: {
          titre: true,
          module: {
            select: {
              nom: true,
              semestre: { select: { nom: true } },
            },
          },
        },
      },
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span>Activité & Révisions en Direct</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisez en temps réel les quiz passés, les étudiants actifs et leur progression
          </p>
        </div>
      </div>

      {/* Cartes métriques temps réel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>🔥</span> Étudiants actifs aujourd&apos;hui
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {activeTodayCount} <span className="text-xs font-normal text-slate-400">/ {totalUsersCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>📝</span> Quiz passés aujourd&apos;hui
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {scoresTodayCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>⚡</span> Statut du serveur
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>En ligne</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Optimal
            </span>
          </div>
        </div>
      </div>

      {/* Flux d'activité en direct */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔴</span> Flux des 40 dernières révisions
          </h2>
          <span className="text-xs text-slate-400">Actualisé en temps réel</span>
        </div>

        {recentScores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucune session de quiz enregistrée pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentScores.map((score) => {
              const pct = Number(score.pourcentage)
              const isPassed = pct >= 50
              const subjectTitle =
                score.cours?.titre || score.examenOfficiel?.titre || 'Épreuve'
              const moduleName =
                score.cours?.sousModule?.module?.nom ||
                score.examenOfficiel?.module?.nom ||
                ''
              const semestreName =
                score.cours?.sousModule?.module?.semestre?.nom ||
                score.examenOfficiel?.module?.semestre?.nom ||
                ''

              return (
                <div
                  key={score.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-teal-200/60 dark:border-teal-900/60">
                      {score.user.prenom[0]}
                      {score.user.nom[0]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {score.user.prenom} {score.user.nom}
                        </span>
                        {score.user.annee && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            Année {score.user.annee}
                          </span>
                        )}
                        {score.user.currentStreak > 0 && (
                          <span className="text-[10px] text-amber-600 font-bold">
                            🔥 {score.user.currentStreak}j
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        {semestreName && (
                          <span className="font-semibold text-teal-600 dark:text-teal-400">
                            {semestreName}
                          </span>
                        )}
                        {moduleName && <span>• {moduleName}</span>}
                        <span>➔ <strong className="text-slate-700 dark:text-slate-200">{subjectTitle}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-lg border text-xs ${
                            isPassed
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {score.score} / {score.total} ({pct}%)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-300">
                          {score.mode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {timeAgo(score.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
