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
            Plateforme QCMed • Service pédagogique indépendant
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎯</span> 1. Nature & Objet du Service
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            <strong>QCMed</strong> est une plateforme numérique éducative indépendante conçue pour accompagner les étudiants en médecine dans l&apos;apprentissage de leurs cours, l&apos;auto-évaluation par QCM et la préparation méthodique de leurs examens.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Le service est une initiative privée d&apos;accompagnement aux études médicales et n&apos;est rattaché administrativement à aucun établissement public ni faculté officielle.
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
              <strong>Données collectées :</strong> Vos nom, prénom, adresse email (utilisée pour l&apos;accès à votre compte), année d&apos;étude, ainsi que vos statistiques d&apos;entraînement (scores, historique des quiz, questions favorites, fiches et notes privées).
            </li>
            <li>
              <strong>Finalité exclusive :</strong> Ces informations sont strictement utilisées pour le bon fonctionnement de votre espace membre, l&apos;enregistrement de votre progression et le suivi de vos révisions.
            </li>
            <li>
              <strong>Confidentialité & Non-cession :</strong> Vos informations personnelles ne sont jamais cédées, louées ou commercialisées à des tiers.
            </li>
            <li>
              <strong>Droit de suppression totale :</strong> Vous disposez d&apos;un droit d&apos;accès, de modification et de suppression intégrale de vos données personnelles, exécutable à tout moment et en un clic depuis votre page <em>Mon Compte</em>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📖</span> 3. Contenus Pédagogiques & Propriété
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Les outils, l&apos;interface logicielle, la structure d&apos;entraînement et les explications pédagogiques sont édités par QCMed pour l&apos;entraînement individuel de ses utilisateurs.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Tout utilisateur constatant une imprécision ou une erreur scientifique peut la signaler directement via l&apos;option <em>Signaler une erreur</em> disponible sur chaque question pour examen et mise à jour continue.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>💎</span> 4. Accès au Service & Abonnements
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            QCMed propose différentes formules d&apos;accès aux contenus et aux fonctionnalités de révision (accès standard ou accès étendu par semestre/module). Les conditions et modalités d&apos;accès applicables sont celles précisées sur la plateforme lors de l&apos;activation des services.
          </p>
        </section>
      </div>
    </div>
  )
}
