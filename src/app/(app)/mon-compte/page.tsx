'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function MonComptePage() {
  const { data: session, update } = useSession()
  const user = session?.user

  // Profil
  const [prenom, setPrenom] = useState(user?.prenom || '')
  const [nom, setNom] = useState(user?.nom || '')
  const [annee, setAnnee] = useState(user?.annee ? String(user.annee) : '1')
  const [profilMsg, setProfilMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profilLoading, setProfilLoading] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.prenom) setPrenom(user.prenom)
      if (user.nom) setNom(user.nom)
      if (user.annee) setAnnee(String(user.annee))
    }
  }, [user])

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [passLoading, setPassLoading] = useState(false)

  // Suppression
  const [deletePass, setDeletePass] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfilLoading(true)
    setProfilMsg(null)

    const anneeNum = typeof annee === 'number' ? annee : parseInt(annee, 10) || 1

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, annee: anneeNum }),
      })

      if (res.ok) {
        await update({ nom, prenom, annee: anneeNum })
        setProfilMsg({ type: 'ok', text: '✅ Vos informations ont été mises à jour avec succès !' })
      } else {
        const data = await res.json().catch(() => ({}))
        setProfilMsg({ type: 'err', text: data.error || '⚠️ Erreur lors de la mise à jour.' })
      }
    } catch {
      setProfilMsg({ type: 'err', text: '⚠️ Erreur de connexion.' })
    } finally {
      setProfilLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassLoading(true)
    setPassMsg(null)

    if (newPassword !== newPasswordConfirm) {
      setPassMsg({ type: 'err', text: 'Les nouveaux mots de passe ne correspondent pas.' })
      setPassLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPassMsg({ type: 'err', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' })
      setPassLoading(false)
      return
    }

    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        setPassMsg({ type: 'ok', text: '✅ Mot de passe modifié avec succès !' })
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
      } else {
        setPassMsg({ type: 'err', text: data.error || 'Erreur lors du changement de mot de passe.' })
      }
    } catch {
      setPassMsg({ type: 'err', text: 'Erreur de connexion.' })
    } finally {
      setPassLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm('Êtes-vous absolument sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) {
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePass }),
      })

      const data = await res.json()

      if (res.ok) {
        signOut({ callbackUrl: '/connexion?deleted=1' })
      } else {
        setDeleteError(data.error || 'Erreur lors de la suppression du compte.')
      }
    } catch {
      setDeleteError('Erreur de connexion.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-900/60">
          <span>⚙️</span> Paramètres du Compte
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Mon Compte
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gérez vos informations personnelles, votre niveau d&apos;étude et votre sécurité
        </p>
      </div>

      {/* Profil */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Informations personnelles
            </h2>
            <p className="text-xs text-slate-500">Mettez à jour votre nom et votre niveau académique</p>
          </div>
        </div>

        {profilMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium ${
              profilMsg.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
            }`}
          >
            {profilMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Prénom
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Adresse email (identifiant officiel)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Année d&apos;étude actuelle
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="1">1ère année (S1 / S2)</option>
              <option value="2">2ème année (S3 / S4)</option>
              <option value="3">3ème année (S5 / S6)</option>
              <option value="4">4ème année (S7 / S8)</option>
              <option value="5">5ème année (S9 / S10)</option>
              <option value="6">6ème année (Internat / Thèse)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={profilLoading}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            {profilLoading ? 'Enregistrement en cours...' : 'Enregistrer les modifications 💾'}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl">
            🔒
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Changer de mot de passe
            </h2>
            <p className="text-xs text-slate-500">Sécurisez votre compte en mettant à jour votre mot de passe</p>
          </div>
        </div>

        {passMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium ${
              passMsg.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
            }`}
          >
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 caractères min."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {passLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Suppression */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400">
              Zone de danger : Supprimer mon compte
            </h2>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/80">
              Cette action efface définitivement toutes vos données (historique, scores, favoris, notes mémos).
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-medium">
            ⚠️ {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-rose-700 dark:text-rose-400 mb-1.5">
              Entrez votre mot de passe pour confirmer la suppression
            </label>
            <input
              type="password"
              required
              value={deletePass}
              onChange={(e) => setDeletePass(e.target.value)}
              placeholder="Votre mot de passe"
              className="w-full px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={deleteLoading}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            {deleteLoading ? 'Suppression en cours...' : 'Supprimer définitivement mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
