'use client'

import { useState } from 'react'
import type { TypeQuestionRef, MotifSignalement } from '@/types'

interface ReportWidgetProps {
  questionType: TypeQuestionRef
  questionId: number
}

export function ReportWidget({ questionType, questionId }: ReportWidgetProps) {
  const [open, setOpen] = useState(false)
  const [motif, setMotif] = useState<MotifSignalement>('reponse_fausse')
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/signaler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType,
          questionId,
          motif,
          commentaire: commentaire.trim(),
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError("Erreur lors de l'envoi du signalement.")
      }
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
      >
        <span>🚩</span>
        <span>Signaler une erreur</span>
      </button>

      {open && (
        <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-3">
          {submitted ? (
            <div className="text-xs text-red-800 dark:text-red-300 font-medium">
              ✅ Signalement enregistré ! Les administrateurs vérifieront cette question.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="text-xs font-bold text-red-900 dark:text-red-300">
                Signaler un problème sur cette question
              </div>

              {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}

              <div>
                <label className="block text-[11px] font-medium text-red-800 dark:text-red-300 mb-0.5">
                  Motif
                </label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value as MotifSignalement)}
                  className="w-full p-2 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="reponse_fausse">Clé de correction / Réponse fausse</option>
                  <option value="enonce_ambigu">Énoncé ambigu / incomplet</option>
                  <option value="faute_frappe">Faute de frappe / typographie</option>
                  <option value="autre">Autre problème</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-red-800 dark:text-red-300 mb-0.5">
                  Précisions (optionnel)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ex : La proposition B est également vraie selon le cours..."
                  className="w-full p-2 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
