import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminSignalementsPage() {
  await requireAdmin()

  const signalements = await prisma.signalement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
  })

  const qcmIds = signalements.filter((s) => s.questionType === 'qcm').map((s) => s.questionId)
  const redactionIds = signalements.filter((s) => s.questionType === 'redaction').map((s) => s.questionId)

  const [qcms, redactions] = await Promise.all([
    prisma.questionQcm.findMany({
      where: { id: { in: qcmIds } },
      select: { id: true, enonce: true, cours: { select: { titre: true } } },
    }),
    prisma.questionRedactionnelle.findMany({
      where: { id: { in: redactionIds } },
      select: { id: true, enonce: true, cours: { select: { titre: true } } },
    }),
  ])

  const questionsMap = new Map<string, { enonce: string; provenance: string }>()
  qcms.forEach((q) => questionsMap.set(`qcm:${q.id}`, { enonce: q.enonce, provenance: q.cours?.titre || 'Annales' }))
  redactions.forEach((r) => questionsMap.set(`redaction:${r.id}`, { enonce: r.enonce, provenance: r.cours?.titre || 'Annales' }))

  async function updateStatut(id: number, statut: 'nouveau' | 'traite' | 'ignore') {
    'use server'
    await requireAdmin()
    await prisma.signalement.update({
      where: { id },
      data: { statut },
    })
    revalidatePath('/admin/signalements')
  }

  async function deleteSignalement(id: number) {
    'use server'
    await requireAdmin()
    await prisma.signalement.delete({ where: { id } })
    revalidatePath('/admin/signalements')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Signalements d&apos;erreurs ({signalements.length})
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Passez en revue les questions signalées par les étudiants
        </p>
      </div>

      {signalements.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          🎉 Aucun signalement d&apos;erreur pour le moment !
        </div>
      ) : (
        <div className="space-y-4">
          {signalements.map((s) => {
            const qInfo = questionsMap.get(`${s.questionType}:${s.questionId}`)
            let badge = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
            if (s.statut === 'traite') badge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            if (s.statut === 'ignore') badge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge}`}>
                      {s.statut.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Motif : {s.motif}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Signalé par {s.user.prenom} {s.user.nom} le{' '}
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Question cible : #{s.questionId} ({s.questionType.toUpperCase()})</span>
                    {qInfo && <span className="text-[11px] text-teal-600 font-normal">{qInfo.provenance}</span>}
                  </div>
                  {qInfo && (
                    <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {qInfo.enonce}
                    </p>
                  )}
                  {s.commentaire && (
                    <p className="italic text-slate-600 dark:text-slate-400 pt-1">
                      Commentaire : « {s.commentaire} »
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {s.statut !== 'traite' && (
                    <form action={updateStatut.bind(null, s.id, 'traite')}>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer"
                      >
                        ✓ Marquer comme traité
                      </button>
                    </form>
                  )}

                  {s.statut !== 'ignore' && (
                    <form action={updateStatut.bind(null, s.id, 'ignore')}>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Ignorer
                      </button>
                    </form>
                  )}

                  <form action={deleteSignalement.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
