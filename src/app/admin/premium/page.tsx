import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminPremiumPage() {
  await requireAdmin()

  const [semestres, users, accessList] = await Promise.all([
    prisma.semestre.findMany({ orderBy: { ordre: 'asc' } }),
    prisma.user.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true, prenom: true, email: true } }),
    prisma.accesPremium.findMany({
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        semestre: true,
      },
      orderBy: { grantedAt: 'desc' },
    }),
  ])

  async function toggleSemestrePremium(semestreId: number, current: boolean) {
    'use server'
    await requireAdmin()
    await prisma.semestre.update({
      where: { id: semestreId },
      data: { estPremium: !current },
    })
    revalidatePath('/admin/premium')
  }

  async function grantAccess(formData: FormData) {
    'use server'
    await requireAdmin()
    const userId = parseInt(formData.get('userId') as string, 10)
    const semestreId = parseInt(formData.get('semestreId') as string, 10)
    const durationMonths = parseInt(formData.get('duration') as string, 10)

    if (isNaN(userId) || isNaN(semestreId)) return

    let expiresAt: Date | null = null
    if (durationMonths > 0) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths)
    }

    await prisma.accesPremium.upsert({
      where: {
        userId_semestreId: { userId, semestreId },
      },
      update: { expiresAt },
      create: { userId, semestreId, expiresAt },
    })

    revalidatePath('/admin/premium')
  }

  async function revokeAccess(id: number) {
    'use server'
    await requireAdmin()
    await prisma.accesPremium.delete({ where: { id } })
    revalidatePath('/admin/premium')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestion des Accès Premium
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Définissez les semestres verrouillés et accordez des accès étudiants
        </p>
      </div>

      {/* Statut des Semestres */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Semestres : Gratuit vs Premium
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {semestres.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <span className="font-semibold text-xs text-slate-900 dark:text-white">{s.nom}</span>
              <form action={toggleSemestrePremium.bind(null, s.id, s.estPremium)}>
                <button
                  type="submit"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    s.estPremium
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {s.estPremium ? '💎 Premium' : '🆓 Gratuit'}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire Accorder un Accès */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          ➕ Accorder un accès premium à un étudiant
        </h2>
        <form action={grantAccess} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            name="userId"
            required
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          >
            <option value="">Sélectionner un étudiant...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom} {u.prenom} ({u.email})
              </option>
            ))}
          </select>

          <select
            name="semestreId"
            required
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          >
            <option value="">Sélectionner un semestre...</option>
            {semestres.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

          <select
            name="duration"
            required
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          >
            <option value="1">1 mois</option>
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
            <option value="12">1 an</option>
            <option value="0">Accès illimité</option>
          </select>

          <button
            type="submit"
            className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
          >
            Valider l&apos;accès
          </button>
        </form>
      </div>

      {/* Liste des accès actifs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs">
          Accès accordés ({accessList.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Étudiant</th>
                <th className="p-3">Semestre</th>
                <th className="p-3">Attribué le</th>
                <th className="p-3">Expiration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accessList.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold">{a.user.prenom} {a.user.nom}</td>
                  <td className="p-3">{a.semestre.nom}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(a.grantedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3 text-slate-500">
                    {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('fr-FR') : 'Illimité'}
                  </td>
                  <td className="p-3 text-right">
                    <form action={revokeAccess.bind(null, a.id)}>
                      <button
                        type="submit"
                        className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] cursor-pointer"
                      >
                        Révoquer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
