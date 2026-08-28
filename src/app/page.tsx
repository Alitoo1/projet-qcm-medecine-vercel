import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Badge Faculté */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold tracking-wide">
          <span>🎓</span> Faculté de Médecine et de Pharmacie de Fès • USMBA
        </div>

        {/* Titre Principal */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Révisez vos examens médicaux en toute <span className="text-teal-600">simplicité</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300">
            Plateforme d&apos;entraînement aux QCU/QCM et questions rédactionnelles, conçue spécialement pour les étudiants en médecine.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {user ? (
            <Link
              href="/tableau-de-bord"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 transition transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-2"
            >
              Accéder à mon tableau de bord →
            </Link>
          ) : (
            <>
              <Link
                href="/inscription"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 transition transform hover:-translate-y-0.5 text-base"
              >
                Créer un compte étudiant
              </Link>
              <Link
                href="/connexion"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition text-base"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Grille de Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-2xl">
              📚
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Navigation par matière</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Arborescence structurée Semestre → Module → Sous-module → Cours pour cibler précisément vos révisions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-2xl">
              ⏱️
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Examens chronométrés</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Entraînez-vous dans les conditions réelles avec minuteur, tirage aléatoire et annales officielles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-2xl">
              📊
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Suivi & Statistiques</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Historique complet de vos tentatives, taux de réussite par module, mode révision d&apos;erreurs et streak quotidien.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
