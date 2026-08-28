import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { normalizeText } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export default async function AdminDoublonsPage() {
  await requireAdmin()

  const allQcms = await prisma.questionQcm.findMany({
    include: { cours: true, partie: { include: { examen: true } } },
  })

  // Grouper par énoncé normalisé
  const groups = new Map<string, typeof allQcms>()

  allQcms.forEach((q) => {
    const key = normalizeText(q.enonce)
    if (key.length < 15) return // ignorer les énoncés trop courts
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(q)
  })

  // Filtrer les groupes qui ont 2 questions ou plus
  const duplicateGroups = Array.from(groups.values()).filter((g) => g.length >= 2)

  async function deleteQuestion(id: number) {
    'use server'
    await requireAdmin()
    await prisma.questionQcm.delete({ where: { id } })
    revalidatePath('/admin/doublons')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Détecteur de Questions en Double ({duplicateGroups.length} groupe(s))
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Repérez les questions similaires importées plusieurs fois par erreur
        </p>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          ✅ Aucun doublon détecté dans la base de questions.
        </div>
      ) : (
        <div className="space-y-6">
          {duplicateGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
            >
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Groupe #{gIdx + 1} : {group.length} exemplaires trouvés
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>ID #{q.id}</span>
                        <span className="font-semibold text-teal-600">
                          {q.cours?.titre || q.partie?.examen?.titre || '—'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 dark:text-white font-medium whitespace-pre-line">
                        {q.enonce}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                      <form action={deleteQuestion.bind(null, q.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer"
                        >
                          Supprimer cet exemplaire
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
