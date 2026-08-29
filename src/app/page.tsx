import Link from 'next/link'
import { auth } from '@/lib/auth'
import { InteractiveDemo } from '@/components/home/InteractiveDemo'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="relative flex-1 flex flex-col items-center px-4 py-12 sm:py-20 sm:px-6 lg:px-8 overflow-hidden">
      {/* Halo de fond lumineux */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[700px] h-[700px] bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-indigo-500/15 rounded-full blur-3xl opacity-75 dark:opacity-40 animate-pulse pointer-events-none" />
      </div>

      <div className="max-w-5xl w-full text-center space-y-12">
        {/* Badge d'en-tête */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-teal-200/80 dark:border-teal-800/80 text-teal-900 dark:text-teal-300 text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:scale-105 transition transform">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-ping" />
          <span>🩺 Plateforme de QCM #1 pour les étudiants en médecine</span>
        </div>

        {/* Titre Principal Choc & Accroche */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Validez vos années de médecine{' '}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
              sans stress.
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            L&apos;outil ultime d&apos;entraînement par QCM & annales pour les futurs médecins. Révisez intelligemment, maîtrisez vos erreurs et majorez vos examens.
          </p>
        </div>

        {/* Boutons d'action CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link
              href="/tableau-de-bord"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 transition transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-2.5"
            >
              <span>Accéder à mon tableau de bord</span>
              <span>→</span>
            </Link>
          ) : (
            <>
              <Link
                href="/inscription"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 transition transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-2"
              >
                <span>Commencer gratuitement</span>
                <span>🚀</span>
              </Link>
              <Link
                href="/connexion"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-800 shadow-sm transition text-base"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Démo Interactive en direct (Mini-QCM) */}
        <div className="pt-4">
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              👇 Testez l&apos;expérience en direct sans inscription
            </span>
          </div>
          <InteractiveDemo />
        </div>

        {/* Les 4 Piliers de la Réussite (Grandes cartes modernes) */}
        <div className="pt-12 text-left space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Conçu par et pour les étudiants en médecine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500 transition group space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                📂
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xl">Arborescence & Matières</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Du S1 au S12, accédez instantanément à vos modules et cours (Anatomie, Sémiologie, Pharmacologie, Cardiovasculaire...).
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500 transition group space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                ⏱️
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xl">Examens Blancs & Annales</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Entraînez-vous dans les conditions réelles avec chronomètre d&apos;épreuve, tirage aléatoire et sessions officielles découpées par parties.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-amber-500 transition group space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                💡
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xl">Corrigés & Explications Médicales</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Chaque question dispose d&apos;une justification claire pour comprendre vos pièges et mémoriser les notions clés à long terme.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-rose-500 transition group space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                🎯
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xl">Révision Intelligente des Erreurs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Relancez en 1 clic un quiz ciblé uniquement sur vos fautes passées, épinglez vos favoris et prenez des fiches mémos privées.
              </p>
            </div>
          </div>
        </div>

        {/* Bannière CTA Finale */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-teal-900 to-slate-900 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-500/20 rounded-full blur-2xl" />
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Prêt à exceller à vos prochains partiels ?
          </h2>
          <p className="max-w-xl mx-auto text-teal-100/80 text-sm sm:text-base font-normal">
            Rejoignez dès maintenant QCMed et commencez à vous entraîner sur des centaines de questions médicales.
          </p>
          <div>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl transition transform hover:scale-105"
            >
              <span>Créer mon compte étudiant gratuit</span>
              <span>⚡</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
