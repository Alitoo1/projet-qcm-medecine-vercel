'use client'

import { useState } from 'react'
import Link from 'next/link'

const demoQuestion = {
  matiere: 'Anatomie Cardiovasculaire',
  enonce: 'Concernant la vascularisation artérielle du cœur, quelle est la proposition exacte ?',
  options: [
    { id: 'A', text: "L'artère coronaire droite vascularise majoritairement l'apex du ventricule gauche.", correct: false },
    { id: 'B', text: "L'artère interventriculaire antérieure (IVA) est une branche de l'artère coronaire gauche.", correct: true },
    { id: 'C', text: "Le tronc coronaire gauche naît au-dessus de la valve pulmonaire.", correct: false },
    { id: 'D', text: "Les artères coronaires se remplissent principalement pendant la systole ventriculaire.", correct: false },
  ],
  explication: "L'artère coronaire gauche se divise rapidement en artère interventriculaire antérieure (IVA) et en artère circonflexe (Cx). La perfusion coronaire a lieu principalement pendant la DIASTOLE.",
}

export function InteractiveDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (id: string) => {
    if (submitted) return
    setSelected(id)
  }

  const handleVerify = () => {
    if (!selected) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelected(null)
    setSubmitted(false)
  }

  const isCorrect = selected === 'B'

  return (
    <div className="w-full max-w-2xl mx-auto text-left">
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-teal-500/10 space-y-5">
        {/* Header de la carte de démo */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-900/60">
              Démo en direct • {demoQuestion.matiere}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">QCU • Testez-vous</span>
        </div>

        {/* Énoncé */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
          {demoQuestion.enonce}
        </h3>

        {/* Options */}
        <div className="space-y-2.5">
          {demoQuestion.options.map((opt) => {
            const isOptSelected = selected === opt.id
            let cardStyle = 'border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 bg-white/60 dark:bg-slate-900/60'

            if (submitted) {
              if (opt.correct) {
                cardStyle = 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
              } else if (isOptSelected && !opt.correct) {
                cardStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
              } else {
                cardStyle = 'opacity-50 border-slate-200 dark:border-slate-800'
              }
            } else if (isOptSelected) {
              cardStyle = 'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-teal-950 dark:text-teal-200 font-semibold shadow-xs'
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none ${cardStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition ${
                    isOptSelected
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {submitted && opt.correct ? '✓' : opt.id}
                </div>
                <span className="leading-relaxed">{opt.text}</span>
              </div>
            )
          })}
        </div>

        {/* Action Button */}
        {!submitted ? (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!selected}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Vérifier ma réponse</span>
            <span>💡</span>
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Feedback alert */}
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="font-extrabold flex items-center gap-2">
                <span>{isCorrect ? '🎯 Excellente réponse !' : '❌ Mauvaise réponse (Bonne réponse : B)'}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-bold">Explication : </span>
                {demoQuestion.explication}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium underline underline-offset-4 cursor-pointer"
              >
                ↻ Réessayer la question
              </button>

              <Link
                href="/inscription"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Débloquer toutes les questions</span>
                <span>🚀</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
