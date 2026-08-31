'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavoriteButton } from '../widgets/FavoriteButton'
import { NoteWidget } from '../widgets/NoteWidget'
import { ReportWidget } from '../widgets/ReportWidget'
import { ClinicalCaseFormatter } from './ClinicalCaseFormatter'
import type { RedactionCaseGroup } from '@/lib/quiz-steps'

interface RedactionClinicalCaseCardProps {
  caseGroup: RedactionCaseGroup
  isExamMode?: boolean
}

export function RedactionClinicalCaseCard({
  caseGroup,
  isExamMode,
}: RedactionClinicalCaseCardProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [evaluations, setEvaluations] = useState<
    Record<
      number,
      {
        reponseModele?: string
        motsTrouves?: string[]
        motsManques?: string[]
        couverture?: number
      }
    >
  >({})
  const [shownCorrections, setShownCorrections] = useState<Record<number, boolean>>({})
  const [loadingQuestions, setLoadingQuestions] = useState<Record<number, boolean>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleEvaluateSubQuestion = async (qId: number) => {
    if (loadingQuestions[qId]) return
    setLoadingQuestions((prev) => ({ ...prev, [qId]: true }))

    try {
      const res = await fetch('/api/quiz/redaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: qId,
          reponse: answers[qId] || '',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEvaluations((prev) => ({
          ...prev,
          [qId]: {
            reponseModele: data.reponse_modele,
            motsTrouves: data.mots_trouves,
            motsManques: data.mots_manques,
            couverture: data.couverture,
          },
        }))
        setShownCorrections((prev) => ({ ...prev, [qId]: true }))
      }
    } catch {
      setShownCorrections((prev) => ({ ...prev, [qId]: true }))
    } finally {
      setLoadingQuestions((prev) => ({ ...prev, [qId]: false }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Bannière d'Observation Clinique / Énoncé Global */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-base sm:text-lg">
          <span>🏥</span>
          <span>{caseGroup.caseTitle}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
            Dossier de {caseGroup.subQuestions.length} questions
          </span>
        </div>

        {caseGroup.initialObservation && (
          <div className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium leading-relaxed bg-white/70 dark:bg-slate-900/70 p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-800/40">
            <ClinicalCaseFormatter text={caseGroup.initialObservation} />
          </div>
        )}
      </div>

      {/* 2. Liste de toutes les questions du cas clinique */}
      <div className="space-y-6">
        {caseGroup.subQuestions.map((subQ, idx) => {
          const qId = subQ.question.id
          const hasCorrection = !!shownCorrections[qId]
          const evalData = evaluations[qId]
          const isSubLoading = !!loadingQuestions[qId]

          return (
            <div
              key={`subq-${qId}`}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5"
            >
              {/* En-tête sous-question */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Question {idx + 1} / {caseGroup.subQuestions.length}
                </span>

                <div className="flex items-center gap-2">
                  <FavoriteButton
                    questionType="redaction"
                    questionId={qId}
                    initialFavori={subQ.question.favori}
                  />
                  <ReportWidget questionType="redaction" questionId={qId} />
                </div>
              </div>

              {/* Énoncé de la sous-question */}
              <div className="text-slate-900 dark:text-slate-100 font-semibold text-base leading-relaxed">
                <ClinicalCaseFormatter text={subQ.questionText} />
              </div>

              {/* Images attachées */}
              {subQ.question.images && subQ.question.images.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {subQ.question.images.map((imgUrl, i) => (
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

              {/* Zone de saisie étudiant */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Votre réponse :
                </label>
                <textarea
                  value={answers[qId] || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [qId]: e.target.value }))
                  }
                  placeholder="Rédigez vos éléments de réponse, diagnostic ou justification..."
                  rows={3}
                  disabled={hasCorrection && isExamMode}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-y"
                />
              </div>

              {/* Bouton d'évaluation de la sous-question */}
              {!isExamMode && !hasCorrection && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleEvaluateSubQuestion(qId)}
                    disabled={isSubLoading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubLoading ? 'Évaluation...' : 'Valider & voir le corrigé'}</span>
                    <span>🔍</span>
                  </button>
                </div>
              )}

              {/* Corrigé / Évaluation */}
              {hasCorrection && (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span>📋</span> Corrigé & Mots-clés
                    </span>
                    {evalData?.couverture !== undefined && evalData.couverture > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Score : {evalData.couverture}%
                      </span>
                    )}
                  </div>

                  {evalData?.reponseModele ? (
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {evalData.reponseModele}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      Question ouverte. Comparez avec vos éléments de cours de référence.
                    </p>
                  )}

                  {evalData?.motsTrouves && evalData.motsTrouves.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {evalData.motsTrouves.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          ✅ {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Note personnelle */}
              <NoteWidget
                questionType="redaction"
                questionId={qId}
                initialNote={subQ.question.note}
              />
            </div>
          )
        })}
      </div>

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
    </div>
  )
}
