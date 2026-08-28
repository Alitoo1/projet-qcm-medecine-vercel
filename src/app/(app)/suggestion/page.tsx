'use client'

import { useState } from 'react'

export default function SuggestionPage() {
  const [contenu, setContenu] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l&apos;envoi.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        <div>
          <span className="text-4xl">💡</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Faire une suggestion
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Une idée d&apos;amélioration, un bug à signaler ou une nouvelle fonctionnalité souhaitée ? Dites-le nous !
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm">
            ✅ Merci pour votre retour ! Votre suggestion a été transmise aux administrateurs.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Votre message (10 à 2000 caractères)
              </label>
              <textarea
                required
                rows={6}
                minLength={10}
                maxLength={2000}
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Exemple : Ce serait super d'ajouter un filtre par type de question dans les examens blancs..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
              />
              <div className="text-right text-xs text-slate-400 mt-1">
                {contenu.length} / 2000
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || contenu.trim().length < 10}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold shadow-xs transition text-sm cursor-pointer"
            >
              {loading ? 'Envoi...' : 'Envoyer ma suggestion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
