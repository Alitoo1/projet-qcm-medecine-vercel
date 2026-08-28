import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { userHasSemestreAccess } from '@/lib/premium'
import Link from 'next/link'

export default async function ExamenBlancPage() {
  const user = await requireAuth()

  // Charger les modules accessibles
  const modules = await prisma.module.findMany({
    orderBy: [{ semestre: { ordre: 'asc' } }, { ordre: 'asc' }],
    include: {
      semestre: true,
      _count: {
        select: {
          sousModules: true,
        },
      },
    },
  })

  // Filtrer les modules accessibles
  const accessibleModules = []
  for (const m of modules) {
    const hasAccess = await userHasSemestreAccess(user.id, m.semestreId, user.role === 'admin')
    if (hasAccess) {
      accessibleModules.push(m)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        <div>
          <span className="text-4xl">📝</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Examen Blanc
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Générez une épreuve aléatoire tirant des questions sur l&apos;ensemble d&apos;un module
          </p>
        </div>

        <form action="/quiz" method="GET" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Choisir la matière / le module
            </label>
            <select
              name="module"
              required
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
            >
              {accessibleModules.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.semestre.nom}] {m.nom}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition cursor-pointer"
          >
            Configurer et démarrer l&apos;examen blanc →
          </button>
        </form>
      </div>
    </div>
  )
}
