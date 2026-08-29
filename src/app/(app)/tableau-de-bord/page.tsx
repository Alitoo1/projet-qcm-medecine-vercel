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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* En-tête avec message de bienvenue et streak */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-900/60">
            <span>✨</span> Espace Étudiant QCMed
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bonjour, {user.prenom} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prêt pour votre entraînement du jour ? Choisissez un cours ci-dessous ou lancez une épreuve blanche.
          </p>
        </div>

        {/* Badge Streak Flamme */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 p-4 rounded-2xl self-start sm:self-center shadow-xs">
          <span className="text-3xl animate-bounce">🔥</span>
          <div>
            <div className="text-xs font-bold text-orange-900 dark:text-orange-300">
              Série d&apos;activité : <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400">{dbUser?.currentStreak || 0} jour(s)</span>
            </div>
            <div className="text-[11px] font-medium text-orange-700/80 dark:text-orange-400/80 mt-0.5">
              Record : {dbUser?.longestStreak || 0} jour(s) consécutifs
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis Examens & Outils */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/examens-officiels"
          className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition transform hover:-translate-y-0.5 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            🎓
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">Examens officiels</div>
            <div className="text-xs text-slate-500">Annales par parties</div>
          </div>
        </Link>

        <Link
          href="/examen-blanc"
          className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500 hover:shadow-md hover:shadow-teal-500/5 transition transform hover:-translate-y-0.5 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            ⏱️
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">Examen blanc</div>
            <div className="text-xs text-slate-500">Tirage aléatoire & minuteur</div>
          </div>
        </Link>

        <Link
          href="/favoris"
          className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/5 transition transform hover:-translate-y-0.5 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            ⭐
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">Mes favoris</div>
            <div className="text-xs text-slate-500">Questions & fiches mémos</div>
          </div>
        </Link>

        <Link
          href="/historique"
          className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/5 transition transform hover:-translate-y-0.5 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            📊
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Historique</div>
            <div className="text-xs text-slate-500">Scores & progression</div>
          </div>
        </Link>
      </div>

      {/* Arborescence & Catalogue */}
      <TreeView semestres={treeData} />
    </div>
  )
}
