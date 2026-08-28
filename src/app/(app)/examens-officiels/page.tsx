import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { userHasSemestreAccess } from '@/lib/premium'

export default async function ExamensOfficielsPage() {
  const user = await requireAuth()

  const examens = await prisma.examenOfficiel.findMany({
    where: user.role === 'admin' ? {} : { estPublie: true },
    orderBy: [{ module: { semestre: { ordre: 'asc' } } }, { module: { ordre: 'asc' } }, { id: 'asc' }],
    include: {
      module: {
        include: {
          semestre: true,
        },
      },
      parties: {
        include: {
          _count: {
            select: {
              questionsQcm: true,
              questionsRedaction: true,
            },
          },
        },
      },
    },
  })

  // Récupérer les 3 derniers scores de l'utilisateur pour chaque examen
  const userScores = await prisma.score.findMany({
    where: {
      userId: user.id,
      examenOfficielId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      examenOfficielId: true,
      score: true,
      total: true,
    },
  })

  const scoresByExamen = new Map<number, { score: number; total: number }[]>()
  userScores.forEach((s) => {
    if (!s.examenOfficielId) return
    if (!scoresByExamen.has(s.examenOfficielId)) {
      scoresByExamen.set(s.examenOfficielId, [])
    }
    const list = scoresByExamen.get(s.examenOfficielId)!
    if (list.length < 3) {
      list.push({ score: s.score, total: s.total })
    }
  })

  const examensWithAccess = await Promise.all(
    examens.map(async (exam) => {
      const hasAccess = await userHasSemestreAccess(
        user.id,
        exam.module.semestreId,
        user.role === 'admin'
      )
      const pastScores = scoresByExamen.get(exam.id) || []
      const totalQcm = exam.parties.reduce((acc, p) => acc + p._count.questionsQcm, 0)
      const totalRedaction = exam.parties.reduce((acc, p) => acc + p._count.questionsRedaction, 0)

      return {
        ...exam,
        hasAccess,
        pastScores,
        totalQcm,
        totalRedaction,
      }
    })
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>🎓</span> Annales & Examens Officiels
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Entraînez-vous sur les sujets réels d&apos;examens passés découpés par parties
        </p>
      </div>

      {examensWithAccess.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          Aucun examen officiel disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examensWithAccess.map((exam) => {
            const { hasAccess, pastScores, totalQcm, totalRedaction } = exam

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>
                      {exam.module.semestre.nom} • {exam.module.nom}
                    </span>
                    {!exam.estPublie && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                        🚫 Brouillon
                      </span>
                    )}
                    {!hasAccess && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        🔒 Premium
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {exam.titre}
                  </h2>

                  <div className="text-xs text-slate-500 space-x-3">
                    <span>📁 {exam.parties.length} partie(s)</span>
                    <span>•</span>
                    <span>📝 {totalQcm} QCM</span>
                    {totalRedaction > 0 && (
                      <>
                        <span>•</span>
                        <span>✍️ {totalRedaction} Rédactionnelles</span>
                      </>
                    )}
                  </div>

                  {/* Historique des tentatives */}
                  {pastScores.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">
                        Dernières tentatives :
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {pastScores.slice().reverse().map((s, i) => (
                          <span key={i} className="inline-flex items-center">
                            {i > 0 && <span className="text-slate-400 mx-1">→</span>}
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              {s.score}/{s.total}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {hasAccess ? (
                    <Link
                      href={`/quiz?officiel=${exam.id}`}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      Passer l&apos;examen →
                    </Link>
                  ) : (
                    <div className="text-center text-xs text-amber-600 dark:text-amber-400 font-semibold py-2">
                      Accès réservé aux membres premium
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
