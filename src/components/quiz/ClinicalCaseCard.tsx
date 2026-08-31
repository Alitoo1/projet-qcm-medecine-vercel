'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavoriteButton } from '../widgets/FavoriteButton'
import { ReportWidget } from '../widgets/ReportWidget'
import type { QuestionQcmClient, CheckAnswerResult } from '@/types'

export interface ParsedCaseQuestion {
  question: QuestionQcmClient
  questionNum: string
  questionText: string
  intermediateNotes: string[]
}

export interface ClinicalCaseGroup {
  caseTitle: string
  initialObservation: string
  subQuestions: ParsedCaseQuestion[]
}

interface ClinicalCaseCardProps {
  caseGroup: ClinicalCaseGroup
  reponses: Record<string, number[]>
  onSelectAnswer: (questionId: number, propIndex: number, isQCU: boolean) => void
  isExamMode: boolean
  onInstantCheckSingle?: (questionId: number) => Promise<CheckAnswerResult | null>
}

export function ClinicalCaseCard({
  caseGroup,
  reponses,
  onSelectAnswer,
  isExamMode,
  onInstantCheckSingle,
}: ClinicalCaseCardProps) {
  const [checkingMap, setCheckingMap] = useState<Record<number, boolean>>({})
  const [checkResults, setCheckResults] = useState<Record<number, CheckAnswerResult | null>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleCheckSingle = async (qId: number) => {
    if (!onInstantCheckSingle || checkingMap[qId]) return
    setCheckingMap((prev) => ({ ...prev, [qId]: true }))
    const res = await onInstantCheckSingle(qId)
    setCheckResults((prev) => ({ ...prev, [qId]: res }))
    setCheckingMap((prev) => ({ ...prev, [qId]: false }))
  }

  const handleCheckAllCase = async () => {
    if (!onInstantCheckSingle) return
    for (const sq of caseGroup.subQuestions) {
      const qId = sq.question.id
      if (!checkResults[qId] && (reponses[String(qId)] || []).length > 0) {
        handleCheckSingle(qId)
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 🏥 Bannière Unifiée du Cas Clinique */}
      <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-cyan-500/10 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/30 rounded-2xl border-2 border-teal-500/30 dark:border-teal-500/20 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-200/50 dark:border-teal-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-base shadow-xs">
              🏥
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {caseGroup.caseTitle}
              </h2>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                Dossier Clinique • {caseGroup.subQuestions.length} questions associées
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
            Cas Clinique Groupé
          </span>
        </div>

        {/* Observation initiale */}
        {caseGroup.initialObservation && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-4 border border-teal-200/40 dark:border-teal-800/30 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
            <div className="font-semibold text-teal-900 dark:text-teal-300 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              📋 Observation Clinique Initiale :
            </div>
            <p className="italic">{caseGroup.initialObservation}</p>
          </div>
        )}
      </div>

      {/* 📝 Liste Déroulée de Toutes les Questions du Cas */}
      <div className="space-y-6">
        {caseGroup.subQuestions.map((sq, qIndex) => {
          const q = sq.question
          const qId = q.id
          const selected = reponses[String(qId)] || []
          const checkRes = checkResults[qId]
          const isQCU = q.type === 'QCU'
          const isChecking = checkingMap[qId] || false

          return (
            <div
              key={qId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5 transition"
            >
              {/* Note intermédiaire d'évolution si présente */}
              {sq.intermediateNotes.length > 0 && (
                <div className="bg-amber-50/80 dark:bg-amber-950/40 rounded-xl p-3.5 border border-amber-200/60 dark:border-amber-800/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                    ℹ️ Évolution / Examen complémentaire :
                  </div>
                  <p className="italic">{sq.intermediateNotes.join(' ')}</p>
                </div>
              )}

              {/* En-tête de sous-question */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                    Q{qIndex + 1}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {q.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FavoriteButton
                    questionType="qcm"
                    questionId={qId}
                    initialFavori={q.favori}
                  />
                  <ReportWidget questionType="qcm" questionId={qId} />
                </div>
              </div>

              {/* Énoncé spécifique de la question */}
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {sq.questionText || q.enonce}
              </div>

              {/* Images attachées si existantes */}
              {q.images && q.images.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {q.images.map((imgUrl, i) => (
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

              {/* Propositions */}
              <div className="space-y-2.5 pt-1">
                {q.propositions.map((p, pIdx) => {
                  const isSelected = selected.includes(p.i)
                  const optionLetter = String.fromCharCode(65 + pIdx)
                  let stateStyle =
                    'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50'

                  if (checkRes) {
                    const isCorrect = checkRes.bonnes_reponses.includes(p.i)
                    if (isCorrect) {
                      stateStyle =
                        'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                    } else if (isSelected) {
                      stateStyle =
                        'bg-rose-50/90 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                    } else {
                      stateStyle = 'opacity-50 border-slate-200 dark:border-slate-800'
                    }
                  } else if (isSelected) {
                    stateStyle =
                      'bg-teal-50/90 dark:bg-teal-950/70 border-teal-600 text-teal-900 dark:text-teal-200 font-semibold shadow-xs'
                  }

                  return (
                    <div
                      key={p.i}
                      onClick={() => !checkRes && onSelectAnswer(qId, p.i, isQCU)}
                      className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border text-sm transition-all duration-150 select-none ${
                        checkRes ? 'cursor-default' : 'cursor-pointer'
                      } ${stateStyle}`}
                    >
                      <div
                        className={`w-6 h-6 ${
                          isQCU ? 'rounded-full' : 'rounded-lg'
                        } border flex items-center justify-center text-xs font-bold shrink-0 transition ${
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

              {/* Bouton de vérification individuelle (Entraînement) */}
              {!isExamMode && !checkRes && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCheckSingle(qId)}
                    disabled={isChecking || selected.length === 0}
                    className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isChecking ? 'Vérification...' : 'Vérifier la question ' + (qIndex + 1) + ' 💡'}
                  </button>
                </div>
              )}

              {/* Explication après vérification */}
              {checkRes && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm border leading-relaxed ${
                    checkRes.correct
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <span className="font-bold">
                    {checkRes.correct ? '✅ Bonne réponse !' : '❌ Réponse incorrecte.'}
                  </span>
                  {checkRes.explication && (
                    <p className="mt-1.5 opacity-90">{checkRes.explication}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action globale du cas (Entraînement) */}
      {!isExamMode && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleCheckAllCase}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition cursor-pointer"
          >
            Vérifier tout le cas clinique 💡
          </button>
        </div>
      )}

      {/* Modal Zoom Image */}
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
    </div>
  )
}
