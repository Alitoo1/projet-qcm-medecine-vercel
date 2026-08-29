export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-900/60 mb-3">
            <span>⚖️</span> Informations Légales & Confidentialité
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Conditions d&apos;Utilisation & Politique de Confidentialité
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Plateforme QCMed • Projet étudiant bénévole et indépendant
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎯</span> 1. Nature & Objet du Projet
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            <strong>QCMed</strong> est une plateforme étudiante indépendante et bénévole, développée à des fins d&apos;entraide pédagogique pour accompagner les étudiants en médecine dans la révision de leurs cours et la préparation de leurs examens.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Ce projet est une initiative personnelle d&apos;apprentissage et de révision. Il n&apos;est rattaché administrativement à aucune faculté officielle.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔒</span> 2. Protection des Données Personnelles (Loi marocaine n° 09-08)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Conformément aux principes de la <strong>Loi n° 09-08</strong> relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel :
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed font-normal">
            <li>
              <strong>Données collectées :</strong> Vos nom, prénom, adresse email (utilisée pour votre connexion), année d&apos;étude, ainsi que vos statistiques d&apos;entraînement (scores, historique de quiz, questions favorites, notes privées).
            </li>
            <li>
              <strong>Finalité exclusive :</strong> Ces informations servent uniquement à sauvegarder votre progression personnelle et à vous permettre de réviser vos erreurs.
            </li>
            <li>
              <strong>Non-commercialisation :</strong> Vos données ne sont jamais partagées, vendues, louées ou cédées à des tiers.
            </li>
            <li>
              <strong>Droit à l&apos;oubli & Suppression totale :</strong> Vous conservez le contrôle total de vos données. Vous pouvez supprimer définitivement votre compte et l&apos;intégralité de vos informations à tout moment depuis la page <em>Mon Compte</em>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📖</span> 3. Contenus Pédagogiques & Entraide
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Les questions, QCM et annales disponibles sur QCMed sont rassemblés et organisés dans un but d&apos;entraînement personnel et collaboratif entre étudiants.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Si vous constatez une erreur dans un énoncé ou une correction, vous pouvez utiliser la fonction <em>Signaler une erreur</em> disponible sous chaque question pour que la communauté puisse la corriger rapidement.
          </p>
        </section>
      </div>
    </div>
  )
}
