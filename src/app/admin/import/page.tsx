'use client'

import { useState } from 'react'

export default function AdminImportPage() {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null)

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      let parsedData: unknown
      try {
        parsedData = JSON.parse(jsonText)
      } catch {
        setResult({ error: 'Le format JSON est invalide.' })
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData }),
      })

      const resData = await res.json()
      if (res.ok) {
        setResult({ count: resData.count })
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Import de Questions en Masse (JSON)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Collez votre fichier JSON structuré pour insérer automatiquement des séries de QCM
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        {result?.count !== undefined && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            ✅ {result.count} question(s) importée(s) avec succès dans la base de données !
          </div>
        )}

        {result?.error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold">
            ⚠️ {result.error}
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contenu JSON des questions
            </label>
            <textarea
              required
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`[
  {
    "cours_id": 1,
    "type": "QCU",
    "enonce": "Quelle est la principale artère du bras ?",
    "propositions": [
      { "t": "Artère brachiale", "c": true },
      { "t": "Artère fémorale", "c": false }
    ],
    "explication": "L'artère brachiale fait suite à l'artère axillaire."
  }
]`}
              className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !jsonText.trim()}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition cursor-pointer"
          >
            {loading ? 'Importation en cours...' : 'Lancer l&apos;importation des questions'}
          </button>
        </form>
      </div>
    </div>
  )
}
