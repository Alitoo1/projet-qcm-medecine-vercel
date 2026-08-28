'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavoriteButton } from '../widgets/FavoriteButton'
import { NoteWidget } from '../widgets/NoteWidget'
import { ReportWidget } from '../widgets/ReportWidget'
import type { QuestionQcmClient, CheckAnswerResult } from '@/types'

interface QuestionCardProps {
  question: QuestionQcmClient
  selectedAnswers: number[]
  onSelectAnswer: (index: number) => void
  isExamMode: boolean
  onInstantCheck?: () => Promise<CheckAnswerResult | null>
}

export function QuestionCard({
  question,
  selectedAnswers,
  onSelectAnswer,
  isExamMode,
  onInstantCheck,
}: QuestionCardProps) {
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckAnswerResult | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const isQCU = question.type === 'QCU'

  const handleOptionClick = (idx: number) => {
    if (checkResult) return // Verrouillé après correction
    onSelectAnswer(idx)
  }

  const handleCheck = async () => {
    if (checking || !onInstantCheck) return
    setChecking(true)
    const res = await onInstantCheck()
    setCheckResult(res)
    setChecking(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* En-tête de question */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
          {question.type}
        </span>

        <div className="flex items-center gap-2">
          <FavoriteButton
            questionType="qcm"
            questionId={question.id}
            initialFavori={question.favori}
          />
          <ReportWidget questionType="qcm" questionId={question.id} />
        </div>
      </div>

      {/* Énoncé */}
      <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
        {question.enonce}
      </div>

      {/* Images attachées */}
      {question.images && question.images.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {question.images.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedImage(imgUrl)}
              className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90 transition cursor-zoom-in"
            >
              <Image
                src={imgUrl}
                alt={`Image question ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal Image Zoom */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Zoom"
              width={1200}
              height={800}
              className="object-contain max-h-full rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Liste des propositions */}
      <div className="space-y-3 pt-2">
        {question.propositions.map((p) => {
          const isSelected = selectedAnswers.includes(p.i)
          let stateStyle = 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'

          if (checkResult) {
            const isCorrectAnswer = checkResult.bonnes_reponses.includes(p.i)
            if (isCorrectAnswer) {
              stateStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200'
            } else if (isSelected) {
              stateStyle = 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200'
            } else {
              stateStyle = 'opacity-60 border-slate-200 dark:border-slate-800'
            }
          } else if (isSelected) {
            stateStyle = 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-200 font-semibold shadow-xs'
          }

          return (
            <div
              key={p.i}
              onClick={() => handleOptionClick(p.i)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm transition cursor-pointer select-none ${stateStyle}`}
            >
              <div
                className={`w-5 h-5 rounded-${isQCU ? 'full' : 'md'} border flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 transition ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isSelected && (isQCU ? '•' : '✓')}
              </div>
              <span className="leading-normal">{p.t}</span>
            </div>
          )
        })}
      </div>

      {/* Bouton de vérification instantanée (Mode entraînement) */}
      {!isExamMode && !checkResult && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking || selectedAnswers.length === 0}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
          >
            {checking ? 'Vérification...' : 'Vérifier ma réponse'}
          </button>
        </div>
      )}

      {/* Explication après vérification */}
      {checkResult && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs leading-relaxed animate-fade-in">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{checkResult.correct ? '✅ Bonne réponse !' : '❌ Réponse incorrecte.'}</span>
          </div>
          {checkResult.explication && (
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {checkResult.explication}
            </p>
          )}
        </div>
      )}

      {/* Note personnelle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <NoteWidget
          questionType="qcm"
          questionId={question.id}
          initialNote={question.note}
        />
      </div>
    </div>
  )
}
