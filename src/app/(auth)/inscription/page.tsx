'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InscriptionPage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [annee, setAnnee] = useState('1')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [cgu, setCgu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (!cgu) {
      setError("Vous devez accepter les conditions d'utilisation.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom,
          nom,
          email,
          annee: parseInt(annee, 10),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.")
        setLoading(false)
        return
      }

      // Connexion automatique immédiate
      const signInRes = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        // En cas d'imprévu sur le signIn, rediriger vers la page de connexion
        router.push('/connexion')
      } else {
        router.push('/tableau-de-bord')
        router.refresh()
      }
    } catch {
      setError("Impossible de contacter le serveur d'inscription.")
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-center space-y-2">
          <span className="text-4xl">📝</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inscription Étudiant</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Rejoignez la communauté des étudiants en médecine
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prénom
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ahmed"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nom
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="El Amrani"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Adresse email
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Année d&apos;étude
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
            >
              <option value="1">1ère année (S1 / S2)</option>
              <option value="2">2ème année (S3 / S4)</option>
              <option value="3">3ème année (S5 / S6)</option>
              <option value="4">4ème année (S7 / S8)</option>
              <option value="5">5ème année (S9 / S10)</option>
              <option value="6">6ème année (Internat / Thèse)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères min."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirmer mot de passe
              </label>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="cgu"
              checked={cgu}
              onChange={(e) => setCgu(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="cgu" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              J&apos;accepte les{' '}
              <Link href="/mentions-legales" className="text-teal-600 underline">
                conditions d&apos;utilisation et la politique de confidentialité
              </Link>{' '}
              (Loi marocaine n° 09-08).
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold shadow-xs transition text-sm cursor-pointer"
          >
            {loading ? 'Création et connexion...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-600 dark:text-slate-400">
          Vous avez déjà un compte ?{' '}
          <Link href="/connexion" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold">
            Connectez-vous
          </Link>
        </div>
      </div>
    </div>
  )
}
