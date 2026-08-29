import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export default async function AdminUtilisateursPage() {
  const currentAdmin = await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      annee: true,
      emailVerifiedAt: true,
      currentStreak: true,
      estBloque: true,
      lastActivityDate: true,
      createdAt: true,
      _count: {
        select: { scores: true },
      },
    },
  })

  async function toggleRole(userId: number, currentRole: string) {
    'use server'
    const admin = await requireAdmin()
    // Empêcher l'admin de s'auto-rétrograder s'il est seul
    if (admin.id === userId && currentRole === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) return
    }
    const newRole = currentRole === 'admin' ? 'etudiant' : 'admin'
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as 'etudiant' | 'admin' },
    })
    revalidatePath('/admin/utilisateurs')
  }

  async function toggleBlockUser(userId: number, currentBloque: boolean) {
    'use server'
    const admin = await requireAdmin()
    if (admin.id === userId) return // Empêcher l'admin de s'auto-bloquer
    await prisma.user.update({
      where: { id: userId },
      data: { estBloque: !currentBloque },
    })
    revalidatePath('/admin/utilisateurs')
  }

  async function deleteUser(userId: number) {
    'use server'
    const admin = await requireAdmin()
    if (admin.id === userId) return // Ne peut pas s'auto-supprimer
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/admin/utilisateurs')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>👥</span> Gestion des Utilisateurs ({users.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervisez les comptes, suspendez les accès frauduleux ou gérez les rôles
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Année</th>
                <th className="p-4">Scores</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isSelf = currentAdmin.id === u.id

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{u.prenom} {u.nom}</span>
                        {isSelf && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                            (Vous)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {u.annee ? `Année ${u.annee}` : '—'}
                    </td>
                    <td className="p-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {u._count.scores}
                    </td>
                    <td className="p-4">
                      {u.estBloque ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          🚫 Suspendu
                        </span>
                      ) : u.emailVerifiedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✅ Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          ⏳ En attente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Bouton Bloquer / Débloquer */}
                      {!isSelf && (
                        <form action={toggleBlockUser.bind(null, u.id, u.estBloque)} className="inline">
                          <button
                            type="submit"
                            title={u.estBloque ? 'Réactiver le compte' : 'Bloquer le compte'}
                            className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition ${
                              u.estBloque
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {u.estBloque ? '🔓 Réactiver' : '🔒 Bloquer'}
                          </button>
                        </form>
                      )}

                      {/* Bouton Rôle */}
                      {!isSelf && (
                        <form action={toggleRole.bind(null, u.id, u.role)} className="inline">
                          <button
                            type="submit"
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}
                          </button>
                        </form>
                      )}

                      {/* Bouton Supprimer */}
                      {!isSelf && (
                        <form action={deleteUser.bind(null, u.id)} className="inline">
                          <button
                            type="submit"
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
