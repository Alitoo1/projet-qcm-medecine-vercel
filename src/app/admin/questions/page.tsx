import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'
import { QuestionsManagerClient } from '@/components/admin/QuestionsManagerClient'

export const dynamic = 'force-dynamic'

export default async function AdminQuestionsPage() {
  await requireAdmin()

  const [semestresHierarchy, partiesList, allQcms] = await Promise.all([
    prisma.semestre.findMany({
      orderBy: { ordre: 'asc' },
      include: {
        modules: {
          orderBy: { ordre: 'asc' },
          include: {
            sousModules: {
              orderBy: { ordre: 'asc' },
              include: {
                cours: {
                  orderBy: { ordre: 'asc' },
                  include: {
                    _count: {
                      select: { questionsQcm: true, questionsRedaction: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.examenPartie.findMany({
      orderBy: { id: 'asc' },
      include: { examen: true },
    }),
    prisma.questionQcm.findMany({
      orderBy: [{ coursId: 'asc' }, { id: 'asc' }],
      include: {
        cours: {
          include: {
            sousModule: {
              include: {
                module: {
                  include: {
                    semestre: {
                      select: { id: true, nom: true },
                    },
                  },
                },
              },
            },
          },
        },
        partie: { include: { examen: true } },
      },
    }),
  ])

  const hierarchy = semestresHierarchy.map((s) => ({
    id: s.id,
    nom: s.nom,
    modules: s.modules.map((m) => ({
      id: m.id,
      nom: m.nom,
      sousModules: m.sousModules.map((sm) => ({
        id: sm.id,
        nom: sm.nom,
        cours: sm.cours.map((c) => ({
          id: c.id,
          titre: c.titre,
          count: c._count.questionsQcm + c._count.questionsRedaction,
        })),
      })),
    })),
  }))

  const allCoursFlat = semestresHierarchy.flatMap((s) =>
    s.modules.flatMap((m) =>
      m.sousModules.flatMap((sm) =>
        sm.cours.map((c) => ({
          id: c.id,
          titre: c.titre,
          moduleNom: m.nom,
        }))
      )
    )
  )

  async function addQcm(formData: FormData) {
    'use server'
    await requireAdmin()
    const enonce = (formData.get('enonce') as string)?.trim()
    const coursIdRaw = formData.get('coursId') as string
    const partieIdRaw = formData.get('partieId') as string
    const explication = (formData.get('explication') as string)?.trim()

    const coursId = coursIdRaw ? parseInt(coursIdRaw, 10) : null
    const partieId = partieIdRaw ? parseInt(partieIdRaw, 10) : null

    if (!enonce) return

    const p1 = (formData.get('p1') as string)?.trim()
    const c1 = formData.get('c1') === 'on'
    const p2 = (formData.get('p2') as string)?.trim()
    const c2 = formData.get('c2') === 'on'
    const p3 = (formData.get('p3') as string)?.trim()
    const c3 = formData.get('c3') === 'on'
    const p4 = (formData.get('p4') as string)?.trim()
    const c4 = formData.get('c4') === 'on'
    const p5 = (formData.get('p5') as string)?.trim()
    const c5 = formData.get('c5') === 'on'

    const propositions = [
      { t: p1, c: c1 },
      { t: p2, c: c2 },
    ]
    if (p3) propositions.push({ t: p3, c: c3 })
    if (p4) propositions.push({ t: p4, c: c4 })
    if (p5) propositions.push({ t: p5, c: c5 })

    const correctCount = propositions.filter((p) => p.c).length
    const type = correctCount > 1 ? 'QCM' : 'QCU'

    await prisma.questionQcm.create({
      data: {
        enonce,
        coursId: coursId && !isNaN(coursId) ? coursId : null,
        partieId: partieId && !isNaN(partieId) ? partieId : null,
        type,
        propositions,
        explication: explication || null,
      },
    })

    revalidatePath('/admin/questions')
  }

  const formattedQuestions = allQcms.map((q) => ({
    id: q.id,
    type: q.type,
    enonce: q.enonce,
    propositions: (Array.isArray(q.propositions) ? q.propositions : []) as {
      i: number
      t: string
      c: boolean
    }[],
    explication: q.explication,
    images: (Array.isArray(q.images) ? (q.images as string[]) : []) as string[],
    coursId: q.coursId,
    cours: q.cours,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📝</span> Gestion & Édition des Questions ({allQcms.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cochez les bonnes réponses, ajustez les justifications médicales ou ajoutez de nouvelles questions
          </p>
        </div>
      </div>

      {/* Gestionnaire Interactif des questions existantes avec filtres hiérarchiques */}
      <QuestionsManagerClient
        initialQuestions={formattedQuestions}
        hierarchy={hierarchy}
      />

      {/* Formulaire Ajouter Manuellement */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>➕</span> Ajouter une nouvelle question QCM/QCU manuelle
        </h2>

        <form action={addQcm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rattacher à un cours
              </label>
              <select
                name="coursId"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              >
                <option value="">Sélectionner un cours...</option>
                {allCoursFlat.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.moduleNom ? `[${c.moduleNom}] ` : ''}
                    {c.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ou rattacher à une partie d&apos;examen
              </label>
              <select
                name="partieId"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              >
                <option value="">Sélectionner une partie d&apos;examen...</option>
                {partiesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.examen.titre} ➔ {p.nom}
                  </option>
                ))}
              </select>
            </div>
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

            <div className="flex items-center gap-2">
              <input type="checkbox" name="c5" className="h-4 w-4 text-teal-600 rounded" />
              <input
                type="text"
                name="p5"
                placeholder="Proposition E (optionnel)"
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
    </div>
  )
}
