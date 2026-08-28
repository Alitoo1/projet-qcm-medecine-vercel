'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConnexionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/tableau-de-bord'
  const verified = searchParams.get('verified') === '1'
  const resetSuccess = searchParams.get('reset') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        if (res.error === 'unverified') {
          setError("Votre adresse email n'a pas encore été vérifiée. Vérifiez votre boîte mail.")
        } else if (res.error.includes('Trop de tentatives')) {
          setError(res.error)
        } else {
          setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.')
        }
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Une erreur est survenue lors de la connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="text-center space-y-2">
        <span className="text-4xl">🩺</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connexion</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Accédez à votre espace d&apos;entraînement QCM
        </p>
      </div>

      {verified && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm">
          ✅ Votre adresse email a été vérifiée avec succès ! Vous pouvez vous connecter.
        </div>
      )}

      {resetSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm">
          ✅ Votre mot de passe a été modifié. Connectez-vous avec vos nouveaux identifiants.
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Adresse email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="etudiant@fmp.ma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mot de passe
            </label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold shadow-xs transition text-sm cursor-pointer"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <div className="text-center pt-2 text-sm text-slate-600 dark:text-slate-400">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold">
          Inscrivez-vous
        </Link>
      </div>
    </div>
  )
}

export default function ConnexionPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-xs text-slate-400">Chargement...</div>}>
        <ConnexionForm />
      </Suspense>
    </div>
  )
}
