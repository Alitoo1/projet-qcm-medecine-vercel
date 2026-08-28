'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function MonComptePage() {
  const { data: session, update } = useSession()
  const user = session?.user

  // Profil
  const [prenom, setPrenom] = useState(user?.prenom || '')
  const [nom, setNom] = useState(user?.nom || '')
  const [annee, setAnnee] = useState(user?.annee || '1')
  const [profilMsg, setProfilMsg] = useState<string | null>(null)
  const [profilLoading, setProfilLoading] = useState(false)

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

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, annee: parseInt(annee, 10) }),
      })

      if (res.ok) {
        await update({ nom, prenom, annee })
        setProfilMsg('✅ Profil mis à jour avec succès !')
      } else {
        setProfilMsg('⚠️ Erreur lors de la mise à jour.')
      }
    } catch {
      setProfilMsg('⚠️ Erreur de connexion.')
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
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Mon Compte
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      {/* Profil */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Informations personnelles
        </h2>

        {profilMsg && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
            {profilMsg}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Adresse email (non modifiable)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Année d&apos;étude
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
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
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer"
          >
            {profilLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Changer de mot de passe
        </h2>

        {passMsg && (
          <div
            className={`p-3.5 rounded-xl text-sm ${
              passMsg.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}
          >
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 caractères min."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer"
          >
            {passLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Suppression */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
          Zone de danger : Supprimer mon compte
        </h2>
        <p className="text-sm text-red-600/90 dark:text-red-400/80">
          La suppression de votre compte efface définitivement toutes vos données (historique, scores, favoris, notes).
        </p>

        {deleteError && (
          <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-sm">
            ⚠️ {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-red-700 dark:text-red-400 mb-1">
              Entrez votre mot de passe pour confirmer
            </label>
            <input
              type="password"
              required
              value={deletePass}
              onChange={(e) => setDeletePass(e.target.value)}
              placeholder="Votre mot de passe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={deleteLoading}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer"
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer définitivement mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
