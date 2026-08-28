'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-3xl mx-auto">
            📩
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email envoyé</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Si un compte correspond à <strong>{email}</strong>, vous recevrez un lien de réinitialisation valable 1 heure.
          </p>
          <div className="pt-4">
            <Link
              href="/connexion"
              className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-center space-y-2">
          <span className="text-4xl">🔑</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mot de passe oublié</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Entrez votre email pour recevoir les instructions de réinitialisation
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Adresse email du compte
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="etudiant@usmba.ac.ma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold shadow-xs transition text-sm cursor-pointer"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/connexion" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
