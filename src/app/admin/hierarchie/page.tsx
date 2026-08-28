import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminHierarchiePage() {
  await requireAdmin()

  const semestres = await prisma.semestre.findMany({
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
              },
            },
          },
        },
      },
    },
  })

  // Server Actions sécurisées avec vérification du rôle Admin
  async function addSemestre(formData: FormData) {
    'use server'
    await requireAdmin()
    const nom = (formData.get('nom') as string)?.trim()
    if (!nom) return
    const maxOrdre = await prisma.semestre.aggregate({ _max: { ordre: true } })
    await prisma.semestre.create({
      data: { nom, ordre: (maxOrdre._max.ordre || 0) + 1 },
    })
    revalidatePath('/admin/hierarchie')
  }

  async function addModule(formData: FormData) {
    'use server'
    await requireAdmin()
    const nom = (formData.get('nom') as string)?.trim()
    const semestreId = parseInt(formData.get('semestreId') as string, 10)
    if (!nom || isNaN(semestreId)) return
    const maxOrdre = await prisma.module.aggregate({
      where: { semestreId },
      _max: { ordre: true },
    })
    await prisma.module.create({
      data: { nom, semestreId, ordre: (maxOrdre._max.ordre || 0) + 1 },
    })
    revalidatePath('/admin/hierarchie')
  }

  async function addSousModule(formData: FormData) {
    'use server'
    await requireAdmin()
    const nom = (formData.get('nom') as string)?.trim()
    const moduleId = parseInt(formData.get('moduleId') as string, 10)
    if (!nom || isNaN(moduleId)) return
    const maxOrdre = await prisma.sousModule.aggregate({
      where: { moduleId },
      _max: { ordre: true },
    })
    await prisma.sousModule.create({
      data: { nom, moduleId, ordre: (maxOrdre._max.ordre || 0) + 1 },
    })
    revalidatePath('/admin/hierarchie')
  }

  async function addCours(formData: FormData) {
    'use server'
    await requireAdmin()
    const titre = (formData.get('titre') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const sousModuleId = parseInt(formData.get('sousModuleId') as string, 10)
    if (!titre || isNaN(sousModuleId)) return
    const maxOrdre = await prisma.cours.aggregate({
      where: { sousModuleId },
      _max: { ordre: true },
    })
    await prisma.cours.create({
      data: {
        titre,
        description: description || null,
        sousModuleId,
        ordre: (maxOrdre._max.ordre || 0) + 1,
      },
    })
    revalidatePath('/admin/hierarchie')
  }

  async function toggleCoursPublie(coursId: number, current: boolean) {
    'use server'
    await requireAdmin()
    await prisma.cours.update({
      where: { id: coursId },
      data: { estPublie: !current },
    })
    revalidatePath('/admin/hierarchie')
  }

  async function deleteItem(type: 'semestre' | 'module' | 'sousmodule' | 'cours', id: number) {
    'use server'
    await requireAdmin()
    if (type === 'semestre') await prisma.semestre.delete({ where: { id } })
    if (type === 'module') await prisma.module.delete({ where: { id } })
    if (type === 'sousmodule') await prisma.sousModule.delete({ where: { id } })
    if (type === 'cours') await prisma.cours.delete({ where: { id } })
    revalidatePath('/admin/hierarchie')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestion de l&apos;Arborescence Pédagogique
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Structurez les semestres, modules, sous-modules et cours
        </p>
      </div>

      {/* Formulaires d'ajout rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ajouter Semestre */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Semestre
          </div>
          <form action={addSemestre} className="flex gap-2">
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex: Semestre 1 (S1)"
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Ajouter
            </button>
          </form>
        </div>

        {/* Ajouter Module */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Module
          </div>
          <form action={addModule} className="space-y-2">
            <select
              name="semestreId"
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            >
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                name="nom"
                required
                placeholder="Ex: Anatomie I"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Arborescence Existante */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Hiérarchie actuelle
        </h2>

        {semestres.length === 0 ? (
          <p className="text-xs text-slate-400">Aucun élément dans l&apos;arborescence.</p>
        ) : (
          <div className="space-y-4">
            {semestres.map((s) => (
              <div
                key={s.id}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span>📁 {s.nom}</span>
                    {s.estPremium && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        Premium
                      </span>
                    )}
                  </div>
                  <form action={deleteItem.bind(null, 'semestre', s.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>

                {/* Modules */}
                <div className="pl-4 space-y-2 border-l-2 border-slate-100 dark:border-slate-800">
                  {s.modules.map((m) => (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>📦 {m.nom}</span>
                        <form action={deleteItem.bind(null, 'module', m.id)}>
                          <button
                            type="submit"
                            className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>

                      {/* Sous-modules */}
                      <div className="pl-4 space-y-1">
                        {m.sousModules.map((sm) => (
                          <div key={sm.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                              <span>📂 {sm.nom}</span>
                              <form action={deleteItem.bind(null, 'sousmodule', sm.id)}>
                                <button
                                  type="submit"
                                  className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer"
                                >
                                  Supprimer
                                </button>
                              </form>
                            </div>

                            {/* Cours */}
                            <div className="pl-4 space-y-1">
                              {sm.cours.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>📄 {c.titre}</span>
                                    <form action={toggleCoursPublie.bind(null, c.id, c.estPublie)}>
                                      <button
                                        type="submit"
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                          c.estPublie
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                        }`}
                                      >
                                        {c.estPublie ? '👁 Publié' : '🚫 Masqué'}
                                      </button>
                                    </form>
                                  </div>

                                  <form action={deleteItem.bind(null, 'cours', c.id)}>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
