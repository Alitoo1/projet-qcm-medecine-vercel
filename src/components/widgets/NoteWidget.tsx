'use client'

import { useState } from 'react'
import type { TypeQuestionRef } from '@/types'

interface NoteWidgetProps {
  questionType: TypeQuestionRef
  questionId: number
  initialNote?: string
}

export function NoteWidget({ questionType, questionId, initialNote = '' }: NoteWidgetProps) {
  const [open, setOpen] = useState(!!initialNote)
  const [note, setNote] = useState(initialNote)
  const [savedNote, setSavedNote] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setStatusMsg(null)

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType,
          questionId,
          contenu: note.trim(),
        }),
      })

      if (res.ok) {
        setSavedNote(note.trim())
        setStatusMsg(note.trim() ? '✅ Note enregistrée' : '✅ Note supprimée')
        setTimeout(() => setStatusMsg(null), 3000)
      } else {
        setStatusMsg('⚠️ Erreur de sauvegarde')
      }
    } catch {
      setStatusMsg('⚠️ Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
      >
        <span>📝</span>
        <span>{savedNote ? 'Ma note' : 'Ajouter une note'}</span>
      </button>

      {open && (
        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-amber-900 dark:text-amber-300">
            <span>Note personnelle (privée et confidentielle)</span>
            {statusMsg && <span className="font-bold">{statusMsg}</span>}
          </div>
          <textarea
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Écrivez un aide-mémoire ou une remarque pour cette question..."
            className="w-full p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-400">
            <span>{note.length} / 1000</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition cursor-pointer"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
