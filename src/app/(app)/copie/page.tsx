import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { FavoriteButton } from '@/components/widgets/FavoriteButton'
import { NoteWidget } from '@/components/widgets/NoteWidget'
import { ReportWidget } from '@/components/widgets/ReportWidget'
import type { PropositionAvecReponse } from '@/types'

interface PageProps {
  searchParams: Promise<{ score_id?: string }>
}

export default async function CopiePage({ searchParams }: PageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const scoreId = params.score_id ? parseInt(params.score_id, 10) : null

  if (!scoreId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 text-sm">Paramètre score_id manquant.</p>
        <Link href="/historique" className="text-teal-600 font-semibold underline text-sm mt-2 inline-block">
          ← Retour à l&apos;historique
        </Link>
      </div>
    )
  }

  const score = await prisma.score.findFirst({
    where: { id: scoreId, userId: user.id },
    include: {
      examenOfficiel: { include: { module: true } },
      cours: true,
      module: true,
    },
  })

  if (!score || !score.reponsesData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 text-sm">Copie introuvable ou archivée sans données détaillées.</p>
        <Link href="/historique" className="text-teal-600 font-semibold underline text-sm mt-2 inline-block">
          ← Retour à l&apos;historique
        </Link>
      </div>
    )
  }

  let snapshot: { ids: number[]; reponses: Record<string, number[]>; shuffle_props?: boolean }
  try {
    snapshot = JSON.parse(score.reponsesData)
  } catch {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 text-sm">Données de la copie corrompues.</p>
      </div>
    )
  }

  const questions = await prisma.questionQcm.findMany({
    where: { id: { in: snapshot.ids } },
    include: { partie: true },
  })
  const questionsMap = new Map(questions.map((q) => [q.id, q]))

  const titre =
    score.examenOfficiel?.titre ||
    score.cours?.titre ||
    (score.module ? `Examen blanc : ${score.module.nom}` : 'Session d&apos;entraînement')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* En-tête de la copie */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/historique" className="text-xs text-teal-600 font-semibold hover:underline">
            ← Retour à l&apos;historique
          </Link>
          <span className="text-xs text-slate-500">
            Passé le {new Date(score.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Copie corrigée : {titre}
          </h1>
          <div className="text-sm font-semibold text-teal-600 dark:text-teal-400">
            Score final : {score.score} / {score.total} ({Number(score.pourcentage)}%)
          </div>
        </div>

        {snapshot.shuffle_props && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900">
            ℹ️ Les propositions ont été mélangées pendant cette épreuve. Les lettres des explications (A, B, C...) renvoient à l&apos;ordre initial.
          </div>
        )}
      </div>

      {/* Liste des questions corrigées */}
      <div className="space-y-6">
        {snapshot.ids.map((qId, index) => {
          const q = questionsMap.get(qId)
          if (!q) return null

          const props = (q.propositions as unknown as PropositionAvecReponse[]) || []
          const userAnswers = snapshot.reponses[String(qId)] || []

          const bonnesReponses = props
            .map((p, idx) => (p.c ? idx : -1))
            .filter((idx) => idx !== -1)

          const isCorrect =
            userAnswers.length === bonnesReponses.length &&
            userAnswers.every((val) => bonnesReponses.includes(val))

          return (
            <div
              key={qId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-500">
                  Question {index + 1} {q.partie && `• ${q.partie.nom}`}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {isCorrect ? '✅ Juste' : '❌ Faux'}
                  </span>
                  <FavoriteButton questionType="qcm" questionId={q.id} />
                  <ReportWidget questionType="qcm" questionId={q.id} />
                </div>
              </div>

              <div className="text-base font-semibold text-slate-900 dark:text-white whitespace-pre-line">
                {q.enonce}
              </div>

              <div className="space-y-2.5 pt-2">
                {props.map((p, idx) => {
                  const wasChosen = userAnswers.includes(idx)
                  const isCorrectAnswer = p.c

                  let style = 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  if (isCorrectAnswer) {
                    style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                  } else if (wasChosen && !isCorrectAnswer) {
                    style = 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200 font-semibold'
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${style}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{isCorrectAnswer ? '✅' : wasChosen ? '❌' : '•'}</span>
                        <span>{p.t}</span>
                      </div>
                      {wasChosen && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          Votre choix
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {q.explication && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">
                    💡 Explication :
                  </div>
                  {q.explication}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <NoteWidget questionType="qcm" questionId={q.id} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
