import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { FavoriteButton } from '@/components/widgets/FavoriteButton'
import { NoteWidget } from '@/components/widgets/NoteWidget'
import type { PropositionAvecReponse } from '@/types'

export default async function FavorisPage() {
  const user = await requireAuth()

  const favoris = await prisma.favori.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const qcmIds = favoris.filter((f) => f.questionType === 'qcm').map((f) => f.questionId)
  const redactionIds = favoris.filter((f) => f.questionType === 'redaction').map((f) => f.questionId)

  const [qcms, redactions, notes] = await Promise.all([
    prisma.questionQcm.findMany({
      where: { id: { in: qcmIds } },
      include: { cours: true, partie: { include: { examen: true } } },
    }),
    prisma.questionRedactionnelle.findMany({
      where: { id: { in: redactionIds } },
      include: { cours: true, partie: { include: { examen: true } } },
    }),
    prisma.noteQuestion.findMany({ where: { userId: user.id } }),
  ])

  const notesMap = new Map(notes.map((n) => [`${n.questionType}:${n.questionId}`, n.contenu]))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>⭐</span> Mes Questions Favorites
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Retrouvez vos questions épinglées avec leurs corrigés détaillés et vos notes
        </p>
      </div>

      {favoris.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          Vous n&apos;avez encore aucune question en favoris. Cliquez sur l&apos;étoile ⭐ pendant un quiz pour épingler une question.
        </div>
      ) : (
        <div className="space-y-6">
          {/* QCM */}
          {qcms.map((q) => {
            const props = (q.propositions as unknown as PropositionAvecReponse[]) || []
            const provenance = q.cours?.titre || q.partie?.examen?.titre || 'Général'
            const userNote = notesMap.get(`qcm:${q.id}`) || ''

            return (
              <div
                key={`qcm-${q.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    📖 {provenance} • {q.type}
                  </span>
                  <FavoriteButton
                    questionType="qcm"
                    questionId={q.id}
                    initialFavori={true}
                  />
                </div>

                <div className="text-base font-semibold text-slate-900 dark:text-white whitespace-pre-line">
                  {q.enonce}
                </div>

                <div className="space-y-2 pt-2">
                  {props.map((p, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                        p.c
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{p.c ? '✅' : '•'}</span>
                      <span>{p.t}</span>
                    </div>
                  ))}
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
                  <NoteWidget
                    questionType="qcm"
                    questionId={q.id}
                    initialNote={userNote}
                  />
                </div>
              </div>
            )
          })}

          {/* Rédactionnelles */}
          {redactions.map((r) => {
            const provenance = r.cours?.titre || r.partie?.examen?.titre || 'Général'
            const userNote = notesMap.get(`redaction:${r.id}`) || ''
            const motsCles = (r.motsCles as string[]) || []

            return (
              <div
                key={`redaction-${r.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    ✍️ {provenance} • Rédactionnelle
                  </span>
                  <FavoriteButton
                    questionType="redaction"
                    questionId={r.id}
                    initialFavori={true}
                  />
                </div>

                <div className="text-base font-semibold text-slate-900 dark:text-white whitespace-pre-line">
                  {r.enonce}
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">
                    📋 Réponse modèle attendue :
                  </div>
                  <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed whitespace-pre-line">
                    {r.reponseModele}
                  </p>
                  {motsCles.length > 0 && (
                    <div className="pt-2">
                      <span className="font-semibold text-indigo-900 dark:text-indigo-200">Mots-clés : </span>
                      <span className="text-indigo-700 dark:text-indigo-400">{motsCles.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <NoteWidget
                    questionType="redaction"
                    questionId={r.id}
                    initialNote={userNote}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
