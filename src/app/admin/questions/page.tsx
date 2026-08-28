import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminQuestionsPage() {
  await requireAdmin()

  const [coursList, qcms] = await Promise.all([
    prisma.cours.findMany({
      orderBy: { titre: 'asc' },
      select: { id: true, titre: true },
    }),
    prisma.questionQcm.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { cours: true, partie: { include: { examen: true } } },
    }),
  ])

  async function addQcm(formData: FormData) {
    'use server'
    await requireAdmin()
    const enonce = (formData.get('enonce') as string)?.trim()
    const coursId = parseInt(formData.get('coursId') as string, 10)
    const explication = (formData.get('explication') as string)?.trim()

    if (!enonce) return

    const p1 = (formData.get('p1') as string)?.trim()
    const c1 = formData.get('c1') === 'on'
    const p2 = (formData.get('p2') as string)?.trim()
    const c2 = formData.get('c2') === 'on'
    const p3 = (formData.get('p3') as string)?.trim()
    const c3 = formData.get('c3') === 'on'
    const p4 = (formData.get('p4') as string)?.trim()
    const c4 = formData.get('c4') === 'on'

    const propositions = [
      { t: p1, c: c1 },
      { t: p2, c: c2 },
    ]
    if (p3) propositions.push({ t: p3, c: c3 })
    if (p4) propositions.push({ t: p4, c: c4 })

    const correctCount = propositions.filter((p) => p.c).length
    const type = correctCount > 1 ? 'QCM' : 'QCU'

    await prisma.questionQcm.create({
      data: {
        enonce,
        coursId: isNaN(coursId) ? null : coursId,
        type,
        propositions,
        explication: explication || null,
      },
    })

    revalidatePath('/admin/questions')
  }

  async function deleteQcm(id: number) {
    'use server'
    await requireAdmin()
    await prisma.questionQcm.delete({ where: { id } })
    revalidatePath('/admin/questions')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestion des Questions
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ajoutez, modifiez ou supprimez des questions manuellement
        </p>
      </div>

      {/* Formulaire Nouvelle Question */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          ➕ Ajouter une nouvelle question QCM/QCU
        </h2>

        <form action={addQcm} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rattacher à un cours
            </label>
            <select
              name="coursId"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            >
              <option value="">Sélectionner un cours...</option>
              {coursList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Énoncé de la question
            </label>
            <textarea
              name="enonce"
              required
              rows={3}
              placeholder="Rédigez l'énoncé de la question ici..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Propositions (cochez la ou les bonnes réponses)
            </label>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="c1" className="h-4 w-4 text-teal-600 rounded" />
              <input
                type="text"
                name="p1"
                required
                placeholder="Proposition A"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="c2" className="h-4 w-4 text-teal-600 rounded" />
              <input
                type="text"
                name="p2"
                required
                placeholder="Proposition B"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="c3" className="h-4 w-4 text-teal-600 rounded" />
              <input
                type="text"
                name="p3"
                placeholder="Proposition C (optionnel)"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="c4" className="h-4 w-4 text-teal-600 rounded" />
              <input
                type="text"
                name="p4"
                placeholder="Proposition D (optionnel)"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Explication du corrigé (optionnel)
            </label>
            <textarea
              name="explication"
              rows={2}
              placeholder="Justification pédagogique affichée après la correction..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Enregistrer la question
          </button>
        </form>
      </div>

      {/* Liste des questions récentes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Questions récentes ({qcms.length})
        </h2>

        <div className="space-y-3">
          {qcms.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="text-[11px] text-teal-600 font-semibold">
                  {q.cours?.titre || q.partie?.examen?.titre || 'Général'} • {q.type}
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2">
                  {q.enonce}
                </div>
              </div>

              <form action={deleteQcm.bind(null, q.id)}>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs cursor-pointer"
                >
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
