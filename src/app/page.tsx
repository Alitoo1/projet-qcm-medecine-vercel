import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="relative flex-1 flex flex-col justify-center items-center px-4 py-16 sm:py-24 sm:px-6 lg:px-8 overflow-hidden">
      {/* Glow Aura Background */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-indigo-500/15 rounded-full blur-3xl opacity-70 dark:opacity-40 animate-pulse pointer-events-none" />
      </div>

      <div className="max-w-5xl w-full text-center space-y-10">
        {/* Badge Faculté & Nouveauté */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-teal-200/80 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 text-xs font-semibold tracking-wide shadow-sm hover:scale-105 transition transform">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
          <span>🎓</span> Faculté de Médecine et de Pharmacie • Plateforme QCMed
        </div>

        {/* Titre Principal & Accroche */}
        <div className="space-y-5">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Révisez vos examens de médecine avec{' '}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              excellence
            </span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            La plateforme d&apos;entraînement de référence pour réussir vos semestres : QCM officiels, correction détaillée, examens blancs chronométrés et fiches mémos.
          </p>
        </div>

        {/* Statistiques Rapides en Pilules */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
            <span>📚</span> 12 Semestres (S1 ➔ S12)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
            <span>🩺</span> 30+ Matières & Modules
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
            <span>⏱️</span> Annales & Épreuves Réelles
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
            <span>🔥</span> Suivi de Streak & Progression
          </div>
        </div>

        {/* Boutons d'action CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          {user ? (
            <Link
              href="/tableau-de-bord"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 transition transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-2.5"
            >
              <span>Accéder à mon tableau de bord</span>
              <span>→</span>
            </Link>
          ) : (
            <>
              <Link
                href="/inscription"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 transition transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-2"
              >
                <span>Commencer gratuitement</span>
                <span>🚀</span>
              </Link>
              <Link
                href="/connexion"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-800 shadow-sm transition text-base"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Grille de Fonctionnalités Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500 dark:hover:border-teal-500 transition group space-y-3.5 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              📂
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Arborescence Complète</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Naviguez par Semestre, Module et Cours pour cibler vos révisions sur les chapitres exacts de votre programme.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500 dark:hover:border-indigo-500 transition group space-y-3.5 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              ⏱️
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Examens Blancs & Annales</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Entraînez-vous dans les conditions réelles d&apos;épreuve : chronomètre, anti-triche serveur et corrigés complets.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-amber-500 dark:hover:border-amber-500 transition group space-y-3.5 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              ⭐
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Favoris & Fiches Mémos</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Épinglez vos questions clés, ajoutez des notes privées et révisez automatiquement vos erreurs passées en 1 clic.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
