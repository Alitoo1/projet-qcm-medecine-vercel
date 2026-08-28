import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { userHasSemestreAccess } from '@/lib/premium'
import { TreeView } from '@/components/arbre/TreeView'
import type { TreeSemestre } from '@/types'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Charger l'utilisateur avec son streak
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      currentStreak: true,
      longestStreak: true,
    },
  })

  // Charger l'arbre directement côté serveur
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
                where: user.role === 'admin' ? {} : { estPublie: true },
                orderBy: { ordre: 'asc' },
                include: {
                  _count: {
                    select: {
                      questionsQcm: true,
                      questionsRedaction: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const treeData: TreeSemestre[] = await Promise.all(
    semestres.map(async (s) => {
      const hasAccess = await userHasSemestreAccess(user.id, s.id, user.role === 'admin')
      return {
        id: s.id,
        nom: s.nom,
        locked: !hasAccess,
        modules: s.modules.map((m) => ({
          id: m.id,
          nom: m.nom,
          sousModules: m.sousModules.map((sm) => ({
            id: sm.id,
            nom: sm.nom,
            cours: sm.cours.map((c) => ({
              id: c.id,
              titre: c.titre,
              description: c.description,
              nbQuestions: c._count.questionsQcm + c._count.questionsRedaction,
              masque: !c.estPublie,
            })),
          })),
        })),
      }
    })
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* En-tête avec message de bienvenue et streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Bonjour, {user.prenom} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prêt pour votre entraînement du jour ? Choisissez une matière ou un examen.
          </p>
        </div>

        {/* Badge Streak */}
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-3.5 rounded-xl self-start sm:self-center">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="text-xs font-semibold text-orange-900 dark:text-orange-300">
              Série actuelle : <span className="font-extrabold">{dbUser?.currentStreak || 0} jour(s)</span>
            </div>
            <div className="text-[11px] text-orange-700 dark:text-orange-400">
              Record : {dbUser?.longestStreak || 0} jour(s)
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis Examens & Outils */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/examens-officiels"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500 transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-2xl group-hover:scale-105 transition">
            🎓
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Examens officiels</div>
            <div className="text-xs text-slate-500">Annales par parties</div>
          </div>
        </Link>

        <Link
          href="/examen-blanc"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500 transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-2xl group-hover:scale-105 transition">
            📝
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Examen blanc</div>
            <div className="text-xs text-slate-500">Tirage aléatoire multi-cours</div>
          </div>
        </Link>

        <Link
          href="/favoris"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500 transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-2xl group-hover:scale-105 transition">
            ⭐
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Mes favoris</div>
            <div className="text-xs text-slate-500">Questions épinglées</div>
          </div>
        </Link>

        <Link
          href="/historique"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500 transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-2xl group-hover:scale-105 transition">
            📊
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Historique</div>
            <div className="text-xs text-slate-500">Scores & progression</div>
          </div>
        </Link>
      </div>

      {/* Arborescence & Catalogue */}
      <TreeView semestres={treeData} />
    </div>
  )
}
