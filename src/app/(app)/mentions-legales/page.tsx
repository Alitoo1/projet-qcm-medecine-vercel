export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Conditions d&apos;utilisation & Confidentialité
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Dernière mise à jour : Août 2026 • Faculté de Médecine et de Pharmacie de Fès (USMBA)
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎯</span> 1. Objet du service
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            La plateforme <strong>QCM Médecine</strong> est un outil pédagogique bénévole destiné exclusivement à l&apos;entraînement personnel des étudiants en médecine inscrits à la Faculté de Médecine et de Pharmacie de Fès (Université Sidi Mohamed Ben Abdellah).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔒</span> 2. Protection des données personnelles (Loi marocaine n° 09-08)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Conformément à la <strong>Loi n° 09-08</strong> relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel :
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <li><strong>Données collectées :</strong> Nom, prénom, adresse email académique/personnelle, année d&apos;étude, scores d&apos;entraînement et notes personnelles.</li>
            <li><strong>Finalité :</strong> Suivi de la progression pédagogique personnelle et calcul de statistiques anonymisées.</li>
            <li><strong>Confidentialité :</strong> Aucune donnée n&apos;est transmise ou vendue à des tiers.</li>
            <li><strong>Droit de suppression :</strong> Vous pouvez supprimer votre compte et l&apos;intégralité de vos données à tout moment depuis la page <em>Mon Compte</em>.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📖</span> 3. Propriété intellectuelle & Contenus
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Les questions et annales d&apos;examens sont issues des enseignements dispensés à la FMP Fès. Elles sont proposées à des fins purement éducatives et non commerciales.
          </p>
        </section>
      </div>
    </div>
  )
}
