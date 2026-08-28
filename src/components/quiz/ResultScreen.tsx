'use client'

import Link from 'next/link'
import type { QuizResult } from '@/types'

interface ResultScreenProps {
  result: QuizResult
  onRestart: () => void
}

export function ResultScreen({ result, onRestart }: ResultScreenProps) {
  const { score, total, pourcentage, parties, streak, scoreId } = result

  let badgeColor = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
  if (pourcentage >= 75) {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
  } else if (pourcentage >= 50) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in text-center">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="space-y-3">
          <span className="text-5xl">
            {pourcentage >= 75 ? '🎉' : pourcentage >= 50 ? '👍' : '💪'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Quiz terminé !
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Voici le bilan de votre session d&apos;entraînement
          </p>
        </div>

        {/* Score Principal */}
        <div className={`p-8 rounded-2xl border ${badgeColor} space-y-2`}>
          <div className="text-5xl sm:text-6xl font-black tracking-tight">
            {pourcentage}%
          </div>
          <div className="text-sm font-semibold">
            {score} / {total} réponses correctes
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 text-sm font-bold">
            <span>🔥</span> Série de {streak} jour{streak > 1 ? 's' : ''} consécutif{streak > 1 ? 's' : ''} !
          </div>
        )}

        {/* Détail par parties (si examen officiel) */}
        {parties && parties.length > 0 && (
          <div className="space-y-3 text-left pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Résultats par partie :
            </h2>
            <div className="space-y-2">
              {parties.map((p, i) => {
                const partPercent = p.total > 0 ? Math.round((p.score / p.total) * 100) : 0
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span>{p.nom}</span>
                      <span>{p.score} / {p.total} ({partPercent}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${partPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href={`/copie?score_id=${scoreId}`}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition"
          >
            📄 Revoir ma copie détaillée
          </Link>
          <button
            onClick={onRestart}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
          >
            🔄 Recommencer
          </button>
          <Link
            href="/tableau-de-bord"
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
