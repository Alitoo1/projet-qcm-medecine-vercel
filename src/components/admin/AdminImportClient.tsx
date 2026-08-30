'use client'

import { useState } from 'react'

interface CoursItem {
  id: number
  titre: string
  sousModuleNom: string
  moduleNom: string
  semestreNom: string
}

export function AdminImportClient({ courses }: { courses: CoursItem[] }) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCoursId, setSelectedCoursId] = useState<number | ''>('')
  const [result, setResult] = useState<{
    count?: number
    qcmCount?: number
    redactionCount?: number
    error?: string
  } | null>(null)

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      let parsedData: unknown
      try {
        parsedData = JSON.parse(jsonText)
      } catch {
        setResult({ error: 'Le format JSON est syntaxiquement invalide (vérifiez les virgules et accolades).' })
        setLoading(false)
        return
      }

      // Si un cours est sélectionné, on peut appliquer son cours_id aux éléments sans cours_id
      let finalData = parsedData
      if (selectedCoursId && Array.isArray(parsedData)) {
        finalData = parsedData.map((item) => ({
          cours_id: item.cours_id || item.coursId || selectedCoursId,
          ...item,
        }))
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: finalData }),
      })

      const resData = await res.json()
      if (res.ok) {
        setResult({
          count: resData.count,
          qcmCount: resData.qcmCount,
          redactionCount: resData.redactionCount,
        })
        setJsonText('')
      } else {
        setResult({ error: resData.error || 'Erreur lors de l&apos;importation.' })
      }
    } catch {
      setResult({ error: 'Erreur réseau lors de l&apos;import.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInjectQcmTemplate = () => {
    const cid = selectedCoursId || 1
    setJsonText(
      JSON.stringify(
        [
          {
            cours_id: cid,
            type: 'QCM',
            enonce: 'Énoncé du QCM médical...',
            propositions: [
              { t: 'Proposition A', c: true },
              { t: 'Proposition B', c: false },
              { t: 'Proposition C', c: true },
              { t: 'Proposition D', c: false },
              { t: 'Proposition E', c: false },
            ],
            explication: 'Justification médicale détaillée...',
            images: [],
          },
        ],
        null,
        2
      )
    )
  }

  const handleInjectRedactionTemplate = () => {
    const cid = selectedCoursId || 1
    setJsonText(
      JSON.stringify(
        [
          {
            cours_id: cid,
            type: 'redaction',
            enonce: 'Énoncé du cas clinique ou de la question rédactionnelle...',
            reponse_modele: 'Réponse modèle détaillée et corrigé officiel...',
            mots_cles: ['mot-clé 1', 'mot-clé 2', 'signe clinique'],
            images: [],
          },
        ],
        null,
        2
      )
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📥</span> Import de Questions en Masse (JSON)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Insérez rapidement des séries complètes de QCM, QCU et Questions Rédactionnelles dans vos cours
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        {result?.count !== undefined && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold space-y-1">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>
                {result.count} question(s) importée(s) avec succès !
              </span>
            </div>
            <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
              {result.qcmCount} QCM/QCU et {result.redactionCount} Question(s) Rédactionnelle(s) sont maintenant en ligne.
            </p>
          </div>
        )}

        {result?.error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
            ⚠️ {result.error}
          </div>
        )}

        {/* Sélecteur d'aide pour le cours cible */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            🎯 Cours Cible (Optionnel - attribue automatiquement l&apos;ID de cours si absent du JSON) :
          </label>
          <select
            value={selectedCoursId}
            onChange={(e) => setSelectedCoursId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">Sélectionner un cours (ou spécifier les cours_id dans le JSON)...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.semestreNom}] [{c.moduleNom}] {c.titre} (ID: {c.id})
              </option>
            ))}
          </select>
        </div>

        {/* Boutons Modèles Rapides */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Modèles d&apos;exemples à coller :
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectQcmTemplate}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition cursor-pointer"
            >
              📋 Exemple QCM (4-5 props)
            </button>
            <button
              type="button"
              onClick={handleInjectRedactionTemplate}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition cursor-pointer"
            >
              ✍️ Exemple Rédactionnelle
            </button>
          </div>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Contenu JSON des questions à importer :
            </label>
            <label className="cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-950 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 shadow-xs">
              📁 Charger un fichier .json
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      setJsonText((event.target?.result as string) || '')
                    }
                    reader.readAsText(file)
                  }
                }}
              />
            </label>
          </div>

          <div>
            <textarea
              required
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Collez ici votre JSON structuré ou chargez un fichier..."
              className="w-full font-mono text-xs p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !jsonText.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            {loading ? 'Importation et validation en cours...' : '🚀 Lancer l&apos;importation dans la base de données'}
          </button>
        </form>
      </div>
    </div>
  )
}
