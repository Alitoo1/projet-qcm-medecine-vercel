import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { generateTempPassword } from '@/lib/utils'
import bcrypt from 'bcryptjs'
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

  async function resetPassword(userId: number) {
    'use server'
    await requireAdmin()
    const tempPass = generateTempPassword(10)
    const passwordHash = await bcrypt.hash(tempPass, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
    revalidatePath('/admin/utilisateurs')
  }

  async function deleteUser(userId: number) {
    'use server'
    const admin = await requireAdmin()
    if (admin.id === userId) return // Ne peut pas s'auto-supprimer depuis cette action
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/admin/utilisateurs')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestion des Utilisateurs ({users.length})
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Supervisez les comptes étudiants et administrateurs
        </p>
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
                <th className="p-4">Statut email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="p-4 text-slate-500">{u.email}</td>
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
                  <td className="p-4 font-mono">{u._count.scores}</td>
                  <td className="p-4">
                    {u.emailVerifiedAt ? (
                      <span className="text-emerald-600 font-semibold">✅ Vérifié</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">⏳ En attente</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <form action={toggleRole.bind(null, u.id, u.role)} className="inline">
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        {u.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}
                      </button>
                    </form>

                    <form action={deleteUser.bind(null, u.id)} className="inline">
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold cursor-pointer"
                      >
                        Supprimer
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
