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

  async function moveSemestre(id: number, direction: 'up' | 'down') {
    'use server'
    await requireAdmin()
    const all = await prisma.semestre.findMany({ orderBy: [{ ordre: 'asc' }, { id: 'asc' }] })
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= all.length) return

    const current = all[idx]
    const target = all[targetIdx]

    // Échanger les ordres
    const currentOrdre = current.ordre === target.ordre ? (direction === 'up' ? idx : idx) : current.ordre
    const targetOrdre = current.ordre === target.ordre ? (direction === 'up' ? idx - 1 : idx + 1) : target.ordre

    await prisma.$transaction([
      prisma.semestre.update({ where: { id: current.id }, data: { ordre: targetOrdre } }),
      prisma.semestre.update({ where: { id: target.id }, data: { ordre: currentOrdre } }),
    ])
    revalidatePath('/admin/hierarchie')
    revalidatePath('/tableau-de-bord')
  }

  async function moveModule(id: number, direction: 'up' | 'down') {
    'use server'
    await requireAdmin()
    const item = await prisma.module.findUnique({ where: { id } })
    if (!item) return
    const all = await prisma.module.findMany({
      where: { semestreId: item.semestreId },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    })
    const idx = all.findIndex((m) => m.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= all.length) return

    const current = all[idx]
    const target = all[targetIdx]

    await prisma.$transaction([
      prisma.module.update({ where: { id: current.id }, data: { ordre: target.ordre || targetIdx } }),
      prisma.module.update({ where: { id: target.id }, data: { ordre: current.ordre || idx } }),
    ])
    revalidatePath('/admin/hierarchie')
    revalidatePath('/tableau-de-bord')
  }

  async function moveSousModule(id: number, direction: 'up' | 'down') {
    'use server'
    await requireAdmin()
    const item = await prisma.sousModule.findUnique({ where: { id } })
    if (!item) return
    const all = await prisma.sousModule.findMany({
      where: { moduleId: item.moduleId },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    })
    const idx = all.findIndex((sm) => sm.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= all.length) return

    const current = all[idx]
    const target = all[targetIdx]

    await prisma.$transaction([
      prisma.sousModule.update({ where: { id: current.id }, data: { ordre: target.ordre || targetIdx } }),
      prisma.sousModule.update({ where: { id: target.id }, data: { ordre: current.ordre || idx } }),
    ])
    revalidatePath('/admin/hierarchie')
    revalidatePath('/tableau-de-bord')
  }

  async function moveCours(id: number, direction: 'up' | 'down') {
    'use server'
    await requireAdmin()
    const item = await prisma.cours.findUnique({ where: { id } })
    if (!item) return
    const all = await prisma.cours.findMany({
      where: { sousModuleId: item.sousModuleId },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    })
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= all.length) return

    const current = all[idx]
    const target = all[targetIdx]

    await prisma.$transaction([
      prisma.cours.update({ where: { id: current.id }, data: { ordre: target.ordre || targetIdx } }),
      prisma.cours.update({ where: { id: target.id }, data: { ordre: current.ordre || idx } }),
    ])
    revalidatePath('/admin/hierarchie')
    revalidatePath('/tableau-de-bord')
  }

  async function deleteItem(type: 'semestre' | 'module' | 'sousmodule' | 'cours', id: number) {
    'use server'
    await requireAdmin()
    if (type === 'semestre') await prisma.semestre.delete({ where: { id } })
    if (type === 'module') await prisma.module.delete({ where: { id } })
    if (type === 'sousmodule') await prisma.sousModule.delete({ where: { id } })
    if (type === 'cours') await prisma.cours.delete({ where: { id } })
    revalidatePath('/admin/hierarchie')
    revalidatePath('/tableau-de-bord')
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ajouter Semestre */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Semestre
          </div>
          <form action={addSemestre} className="flex flex-col gap-2">
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex: Semestre 1 (S1)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Ajouter Semestre
            </button>
          </form>
        </div>

        {/* Ajouter Module */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Module
          </div>
          <form action={addModule} className="space-y-2">
            <select
              name="semestreId"
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            >
              <option value="">Sélectionner semestre...</option>
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex: Anatomie I"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Ajouter Module
            </button>
          </form>
        </div>

        {/* Ajouter Sous-Module */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Sous-Module
          </div>
          <form action={addSousModule} className="space-y-2">
            <select
              name="moduleId"
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            >
              <option value="">Sélectionner module...</option>
              {semestres.flatMap((s) =>
                s.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {s.nom} ➔ {m.nom}
                  </option>
                ))
              )}
            </select>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex: Membre supérieur"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Ajouter Sous-Module
            </button>
          </form>
        </div>

        {/* Ajouter Cours */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ➕ Nouveau Cours
          </div>
          <form action={addCours} className="space-y-2">
            <select
              name="sousModuleId"
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            >
              <option value="">Sélectionner sous-module...</option>
              {semestres.flatMap((s) =>
                s.modules.flatMap((m) =>
                  m.sousModules.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {m.nom} ➔ {sm.nom}
                    </option>
                  ))
                )
              )}
            </select>
            <input
              type="text"
              name="titre"
              required
              placeholder="Ex: Ostéologie du bras"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
            />
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Ajouter Cours
            </button>
          </form>
        </div>
      </div>

      {/* Arborescence Existante */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🌳</span> Hiérarchie actuelle
          </h2>
          <span className="text-xs text-slate-400">
            Utilisez les flèches <strong>▲ / ▼</strong> pour réorganiser l&apos;affichage pour les étudiants
          </span>
        </div>

        {semestres.length === 0 ? (
          <p className="text-xs text-slate-400">Aucun élément dans l&apos;arborescence.</p>
        ) : (
          <div className="space-y-4">
            {semestres.map((s, sIdx) => (
              <div
                key={s.id}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/40 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📁 {s.nom}</span>
                    {s.estPremium && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Flèches réorganisation Semestre */}
                    <form action={moveSemestre.bind(null, s.id, 'up')}>
                      <button
                        type="submit"
                        disabled={sIdx === 0}
                        title="Monter le semestre"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400 disabled:opacity-30 disabled:pointer-events-none text-xs font-black transition cursor-pointer"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveSemestre.bind(null, s.id, 'down')}>
                      <button
                        type="submit"
                        disabled={sIdx === semestres.length - 1}
                        title="Descendre le semestre"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400 disabled:opacity-30 disabled:pointer-events-none text-xs font-black transition cursor-pointer"
                      >
                        ▼
                      </button>
                    </form>

                    <form action={deleteItem.bind(null, 'semestre', s.id)} className="ml-2">
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>

                {/* Modules */}
                <div className="pl-4 space-y-2 border-l-2 border-teal-500/20 dark:border-teal-500/10">
                  {s.modules.map((m, mIdx) => (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold">📦 {m.nom}</span>

                        <div className="flex items-center gap-1">
                          {/* Flèches réorganisation Module */}
                          <form action={moveModule.bind(null, m.id, 'up')}>
                            <button
                              type="submit"
                              disabled={mIdx === 0}
                              title="Monter le module"
                              className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-300 disabled:opacity-25 disabled:pointer-events-none text-[11px] font-black transition cursor-pointer"
                            >
                              ▲
                            </button>
                          </form>
                          <form action={moveModule.bind(null, m.id, 'down')}>
                            <button
                              type="submit"
                              disabled={mIdx === s.modules.length - 1}
                              title="Descendre le module"
                              className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-300 disabled:opacity-25 disabled:pointer-events-none text-[11px] font-black transition cursor-pointer"
                            >
                              ▼
                            </button>
                          </form>

                          <form action={deleteItem.bind(null, 'module', m.id)} className="ml-1">
                            <button
                              type="submit"
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Sous-modules */}
                      <div className="pl-4 space-y-1.5 border-l-2 border-slate-200/50 dark:border-slate-700/50">
                        {m.sousModules.map((sm, smIdx) => (
                          <div key={sm.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-lg">
                              <span>📂 {sm.nom}</span>

                              <div className="flex items-center gap-1">
                                {/* Flèches réorganisation Sous-Module */}
                                <form action={moveSousModule.bind(null, sm.id, 'up')}>
                                  <button
                                    type="submit"
                                    disabled={smIdx === 0}
                                    title="Monter le sous-module"
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-700 hover:text-teal-600 disabled:opacity-25 disabled:pointer-events-none text-[10px] font-black transition cursor-pointer"
                                  >
                                    ▲
                                  </button>
                                </form>
                                <form action={moveSousModule.bind(null, sm.id, 'down')}>
                                  <button
                                    type="submit"
                                    disabled={smIdx === m.sousModules.length - 1}
                                    title="Descendre le sous-module"
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-700 hover:text-teal-600 disabled:opacity-25 disabled:pointer-events-none text-[10px] font-black transition cursor-pointer"
                                  >
                                    ▼
                                  </button>
                                </form>

                                <form action={deleteItem.bind(null, 'sousmodule', sm.id)} className="ml-1">
                                  <button
                                    type="submit"
                                    className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    Supprimer
                                  </button>
                                </form>
                              </div>
                            </div>

                            {/* Cours */}
                            <div className="pl-4 space-y-1">
                              {sm.cours.map((c, cIdx) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 text-xs border border-slate-100 dark:border-slate-700/40"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">📄 {c.titre}</span>
                                    {c.description && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-900/60">
                                        👤 {c.description}
                                      </span>
                                    )}
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

                                  <div className="flex items-center gap-1">
                                    {/* Flèches réorganisation Cours */}
                                    <form action={moveCours.bind(null, c.id, 'up')}>
                                      <button
                                        type="submit"
                                        disabled={cIdx === 0}
                                        title="Monter le cours"
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:text-teal-600 disabled:opacity-25 disabled:pointer-events-none text-[10px] font-black transition cursor-pointer"
                                      >
                                        ▲
                                      </button>
                                    </form>
                                    <form action={moveCours.bind(null, c.id, 'down')}>
                                      <button
                                        type="submit"
                                        disabled={cIdx === sm.cours.length - 1}
                                        title="Descendre le cours"
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:text-teal-600 disabled:opacity-25 disabled:pointer-events-none text-[10px] font-black transition cursor-pointer"
                                      >
                                        ▼
                                      </button>
                                    </form>

                                    <form action={deleteItem.bind(null, 'cours', c.id)} className="ml-1">
                                      <button
                                        type="submit"
                                        className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                                      >
                                        Supprimer
                                      </button>
                                    </form>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
