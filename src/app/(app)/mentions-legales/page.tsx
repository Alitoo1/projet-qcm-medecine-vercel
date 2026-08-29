export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 shadow-sm space-y-9">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-900/60 mb-3">
            <span>⚖️</span> Cadre Juridique & Conditions Générales
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Conditions d&apos;Utilisation & Politique de Confidentialité
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Plateforme QCMed • Service pédagogique numérique indépendant
          </p>
        </div>

        {/* 1. Nature & Objet */}
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

        {/* 2. Usage Personnel & Anti-Partage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>👤</span> 2. Licence d&apos;Utilisation Personnelle & Interdiction de Partage
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            L&apos;accès à un compte QCMed est <strong>strictement personnel, individuel et non transférable</strong>. Chaque utilisateur est responsable de la confidentialité de ses identifiants.
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed font-normal">
            <li>Il est formellement interdit de prêter, partager, céder ou mutualiser un compte avec un ou plusieurs tiers.</li>
            <li>En cas de détection d&apos;usages simultanés anormaux ou de partages avérés, QCMed se réserve le droit de restreindre ou de suspendre l&apos;accès au compte sans préavis ni remboursement.</li>
          </ul>
        </section>

        {/* 3. Propriété Intellectuelle, Anti-Scraping & Notice and Takedown */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📖</span> 3. Propriété Intellectuelle, Protection Anti-Pillage & Retrait
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            L&apos;architecture logicielle, le design, l&apos;arborescence, les synthèses et les explications détaillées rédigées sur la plateforme sont la propriété intellectuelle exclusive de <strong>QCMed</strong>.
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed font-normal">
            <li>
              <strong>Interdiction de reproduction :</strong> Toute extraction automatisée (scraping), capture massive, redistribution ou revente des contenus sous forme de fichiers PDF, banques de données ou canaux tiers (WhatsApp, Telegram, etc.) est strictement interdite et passible de poursuites.
            </li>
            <li>
              <strong>Annales & Courte citation :</strong> Les énoncés issus d&apos;annales sont cités à titre d&apos;illustration et d&apos;entraînement pédagogique individuel.
            </li>
          </ul>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed font-normal">
            <p className="font-bold text-slate-900 dark:text-white">
              🛡️ Procédure de retrait pour ayant droit (Notice & Takedown) :
            </p>
            <p>
              Si un enseignant, auteur ou ayant droit légitime souhaite le retrait d&apos;un sujet ou d&apos;une ressource spécifique lui appartenant, il lui suffit d&apos;adresser une simple demande écrite via notre formulaire de suggestion ou par email. Le contenu concerné sera examiné et retiré sans délai.
            </p>
          </div>
        </section>

        {/* 4. Non-Responsabilité Médicale */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🩺</span> 4. Clause de Non-Responsabilité Médicale & Pédagogique (Exonération)
          </h2>
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed font-normal">
            <p className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-sm">
              <span>⚠️</span> Avertissement Pédagogique & Limite de Responsabilité :
            </p>
            <p>
              <strong>1. Outil d&apos;entraînement d&apos;appoint :</strong> QCMed est un support d&apos;auto-évaluation complémentaire. Malgré le soin apporté à la vérification des corrections, la plateforme ne remplace pas les cours magistraux, polycopiés officiels ou recommandations universitaires de référence.
            </p>
            <p>
              <strong>2. Absence d&apos;avis médical clinique :</strong> Les contenus, cas cliniques et explications proposés sont purement didactiques. Ils ne constituent en aucun cas une directive de pratique clinique, une prescription ou un avis médical opposable dans la prise en charge de patients réels.
            </p>
            <p>
              <strong>3. Exonération :</strong> QCMed ne saurait être tenu responsable d&apos;éventuelles divergences scientifiques, errata d&apos;examen ou conséquences liées à l&apos;utilisation des informations fournies sur la plateforme.
            </p>
          </div>
        </section>

        {/* 5. Disponibilité & Maintenance */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>⚡</span> 5. Disponibilité du Service & Mises à Jour
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            QCMed s&apos;efforce d&apos;assurer une disponibilité continue de ses services. Cependant, l&apos;accès peut être temporairement suspendu pour des raisons de maintenance, d&apos;amélioration technique ou d&apos;incidents réseau indépendants de notre volonté.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            La médecine évoluant constamment, QCMed se réserve le droit d&apos;actualiser, de corriger ou de faire évoluer sa base de données à tout moment pour préserver la qualité scientifique de ses contenus.
          </p>
        </section>

        {/* 6. Formules d'Accès & Contenus Numériques */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>💎</span> 6. Formules d&apos;Accès, Abonnements & Services Numériques
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            QCMed propose différentes formules d&apos;accès aux contenus et aux fonctionnalités de révision (accès standard ou accès étendu par semestre/module).
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            S&apos;agissant de contenus numériques mis à disposition immédiatement après activation du compte ou du pack correspondant, l&apos;exécution du service est immédiate dès l&apos;accès aux modules de révision.
          </p>
        </section>

        {/* 7. Protection des Données Personnelles */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔒</span> 7. Protection des Données Personnelles (Loi marocaine n° 09-08)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Conformément aux principes de la <strong>Loi n° 09-08</strong> relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel :
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed font-normal">
            <li>
              <strong>Données collectées :</strong> Vos nom, prénom, adresse email (utilisée pour l&apos;accès sécurisé à votre compte), année d&apos;étude, ainsi que vos statistiques d&apos;entraînement (scores, historique des quiz, questions favorites, fiches et notes privées).
            </li>
            <li>
              <strong>Finalité exclusive :</strong> Ces informations sont strictement utilisées pour le bon fonctionnement de votre espace personnel, l&apos;enregistrement de votre progression et le suivi de vos révisions.
            </li>
            <li>
              <strong>Confidentialité & Non-cession :</strong> Vos informations personnelles ne sont jamais cédées, louées ou commercialisées à des tiers.
            </li>
            <li>
              <strong>Droit de suppression totale :</strong> Vous disposez d&apos;un droit d&apos;accès, de modification et de suppression intégrale de vos données personnelles, exécutable à tout moment et en un clic depuis votre page <em>Mon Compte</em>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
