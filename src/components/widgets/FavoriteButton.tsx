'use client'

import { useState } from 'react'
import type { TypeQuestionRef } from '@/types'

interface FavoriteButtonProps {
  questionType: TypeQuestionRef
  questionId: number
  initialFavori?: boolean
  onToggle?: (isFavori: boolean) => void
}

export function FavoriteButton({
  questionType,
  questionId,
  initialFavori = false,
  onToggle,
}: FavoriteButtonProps) {
  const [favori, setFavori] = useState(initialFavori)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)

    const nextState = !favori
    setFavori(nextState)

    try {
      const res = await fetch('/api/favoris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType, questionId }),
      })

      const data = await res.json()
      if (res.ok) {
        setFavori(data.favorited)
        onToggle?.(data.favorited)
      } else {
        setFavori(!nextState)
      }
    } catch {
      setFavori(!nextState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
        favori
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
      }`}
    >
      <span>{favori ? '⭐' : '☆'}</span>
      <span>{favori ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
    </button>
  )
}
