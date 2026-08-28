import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminExamensPage() {
  await requireAdmin()

  const [examens, modules] = await Promise.all([
    prisma.examenOfficiel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        module: { include: { semestre: true } },
        parties: {
          orderBy: { ordre: 'asc' },
          include: {
            _count: {
              select: { questionsQcm: true, questionsRedaction: true },
            },
          },
        },
      },
    }),
    prisma.module.findMany({
      orderBy: [{ semestre: { ordre: 'asc' } }, { ordre: 'asc' }],
      include: { semestre: true },
    }),
  ])

  async function createExamen(formData: FormData) {
    'use server'
    await requireAdmin()
    const titre = (formData.get('titre') as string)?.trim()
    const moduleId = parseInt(formData.get('moduleId') as string, 10)
    if (!titre || isNaN(moduleId)) return

    await prisma.examenOfficiel.create({
      data: { titre, moduleId },
    })
    revalidatePath('/admin/examens')
  }

  async function addPartie(formData: FormData) {
    'use server'
    await requireAdmin()
    const nom = (formData.get('nom') as string)?.trim()
    const examenId = parseInt(formData.get('examenId') as string, 10)
    if (!nom || isNaN(examenId)) return

    const maxOrdre = await prisma.examenPartie.aggregate({
      where: { examenId },
      _max: { ordre: true },
    })

    await prisma.examenPartie.create({
      data: {
        nom,
        examenId,
        ordre: (maxOrdre._max.ordre || 0) + 1,
      },
    })
    revalidatePath('/admin/examens')
  }

  async function togglePublie(examenId: number, current: boolean) {
    'use server'
    await requireAdmin()
    await prisma.examenOfficiel.update({
      where: { id: examenId },
      data: { estPublie: !current },
    })
    revalidatePath('/admin/examens')
  }

  async function deleteExamen(examenId: number) {
    'use server'
    await requireAdmin()
    await prisma.examenOfficiel.delete({ where: { id: examenId } })
    revalidatePath('/admin/examens')
  }

  async function deletePartie(partieId: number) {
    'use server'
    await requireAdmin()
    await prisma.examenPartie.delete({ where: { id: partieId } })
    revalidatePath('/admin/examens')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestion des Examens Officiels ({examens.length})
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Créez des épreuves d&apos;annales et organisez-les en parties/sections
        </p>
      </div>

      {/* Formulaire Nouvel Examen */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          ➕ Créer une nouvelle épreuve officielle
        </h2>
        <form action={createExamen} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            name="moduleId"
            required
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.semestre.nom}] {m.nom}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="titre"
            required
            placeholder="Ex: Session normale — Janvier 2024"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          />
          <button
            type="submit"
            className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
          >
            Créer l&apos;examen
          </button>
        </form>
      </div>

      {/* Liste des Examens */}
      <div className="space-y-4">
        {examens.map((exam) => (
          <div
            key={exam.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">
                  {exam.module.semestre.nom} • {exam.module.nom}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {exam.titre}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <form action={togglePublie.bind(null, exam.id, exam.estPublie)}>
                  <button
                    type="submit"
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      exam.estPublie
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {exam.estPublie ? '👁 Publié' : '🚫 Masqué'}
                  </button>
                </form>

                <form action={deleteExamen.bind(null, exam.id)}>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>

            {/* Parties de l'examen */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Parties de l&apos;épreuve ({exam.parties.length})
              </div>

              <div className="space-y-2">
                {exam.parties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {p.nom}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({p._count.questionsQcm} QCM, {p._count.questionsRedaction} Rédac)
                      </span>
                    </div>

                    <form action={deletePartie.bind(null, p.id)}>
                      <button
                        type="submit"
                        className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              {/* Ajouter Partie */}
              <form action={addPartie} className="flex gap-2 pt-2">
                <input type="hidden" name="examenId" value={exam.id} />
                <input
                  type="text"
                  name="nom"
                  required
                  placeholder="Nom de la section (ex: Partie 1 : Mycologie)"
                  className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Ajouter partie
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
