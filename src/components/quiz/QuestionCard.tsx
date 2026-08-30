'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavoriteButton } from '../widgets/FavoriteButton'
import { NoteWidget } from '../widgets/NoteWidget'
import { ReportWidget } from '../widgets/ReportWidget'
import type { QuestionQcmClient, CheckAnswerResult } from '@/types'

import { ClinicalCaseFormatter } from './ClinicalCaseFormatter'

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
      <ClinicalCaseFormatter text={question.enonce} />

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
        {question.propositions.map((p, index) => {
          const isSelected = selectedAnswers.includes(p.i)
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D, E...
          let stateStyle = 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50'

          if (checkResult) {
            const isCorrectAnswer = checkResult.bonnes_reponses.includes(p.i)
            if (isCorrectAnswer) {
              stateStyle = 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
            } else if (isSelected) {
              stateStyle = 'bg-rose-50/90 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
            } else {
              stateStyle = 'opacity-50 border-slate-200 dark:border-slate-800'
            }
          } else if (isSelected) {
            stateStyle = 'bg-teal-50/90 dark:bg-teal-950/70 border-teal-600 text-teal-900 dark:text-teal-200 font-semibold shadow-xs'
          }

          return (
            <div
              key={p.i}
              onClick={() => handleOptionClick(p.i)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border text-sm transition-all duration-150 cursor-pointer select-none ${stateStyle}`}
            >
              {/* Badge de lettre A, B, C, D... */}
              <div
                className={`w-6 h-6 ${isQCU ? 'rounded-full' : 'rounded-lg'} border flex items-center justify-center text-xs font-bold shrink-0 transition ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isSelected ? (isQCU ? '•' : '✓') : optionLetter}
              </div>
              <span className="leading-relaxed pt-0.5">{p.t}</span>
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {checking ? 'Vérification en cours...' : 'Vérifier ma réponse 💡'}
          </button>
        </div>
      )}

      {/* Résultat de la vérification instantanée */}
      {checkResult && (
        <div
          className={`p-5 rounded-2xl border text-xs space-y-2 animate-fade-in ${
            checkResult.correct
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="font-extrabold text-sm flex items-center gap-2">
            <span>{checkResult.correct ? '✅ Excellente réponse !' : '❌ Réponse incorrecte'}</span>
          </div>

          {checkResult.explication && (
            <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 leading-relaxed space-y-1">
              <span className="font-bold">💡 Explication médicale :</span>
              <p className="whitespace-pre-line text-slate-800 dark:text-slate-200 font-normal">
                {checkResult.explication}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Widgets Favoris, Notes privées & Signalement */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <FavoriteButton
            questionType="qcm"
            questionId={question.id}
            initialFavori={question.favori}
          />
          <ReportWidget
            questionType="qcm"
            questionId={question.id}
          />
        </div>

        <div className="flex-1 max-w-sm">
          <NoteWidget
            questionType="qcm"
            questionId={question.id}
            initialNote={question.note}
          />
        </div>
      </div>
    </div>
  )
}
