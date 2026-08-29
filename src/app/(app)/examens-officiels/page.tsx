import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { userHasSemestreAccess } from '@/lib/premium'
import { ExamensOfficielsClient } from '@/components/examens/ExamensOfficielsClient'

export const dynamic = 'force-dynamic'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>🎓</span> Annales & Examens Officiels
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Entraînez-vous sur les épreuves réelles classées méthodiquement par semestre et par module
          </p>
        </div>
      </div>

      <ExamensOfficielsClient examens={examensWithAccess} />
    </div>
  )
}
