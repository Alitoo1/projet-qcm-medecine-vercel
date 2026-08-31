'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProgressBar } from './ProgressBar'
import { QuestionCard } from './QuestionCard'
import { ClinicalCaseCard } from './ClinicalCaseCard'
import { ResultScreen } from './ResultScreen'
import { useTimer } from '@/hooks/use-timer'
import { groupQuestionsIntoSteps, type QuizStep } from '@/lib/quiz-steps'
import type { QuestionQcmClient, QuizResult, CheckAnswerResult, ExamItem } from '@/types'

interface QuizEngineProps {
  coursId?: number
  moduleId?: number
  officielId?: number
  revisionScoreId?: number
  initialMode?: 'entrainement' | 'examen'
}

export function QuizEngine({
  coursId,
  moduleId,
  officielId,
  revisionScoreId,
  initialMode = 'entrainement',
}: QuizEngineProps) {
  // Configuration
  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState<'entrainement' | 'examen'>(initialMode)
  const [durationMin, setDurationMin] = useState(30)
  const [shuffleProps, setShuffleProps] = useState(false)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)

  // État du quiz
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuestionQcmClient[]>([])
  const [examToken, setExamToken] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [reponses, setReponses] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Étapes groupées (Cas cliniques groupés sur la même page)
  const steps: QuizStep[] = useMemo(() => {
    return groupQuestionsIntoSteps(questions)
  }, [questions])

  // Soumission finale du quiz
  const handleSubmitQuiz = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/quiz/soumettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reponses,
          duree: mode === 'examen' ? durationMin * 60 - timer.secondsLeft : undefined,
          cours_id: coursId,
          mode: revisionScoreId ? 'revision' : mode,
          exam_module_id: moduleId,
          officiel_examen_id: officielId,
          revision_score_id: revisionScoreId,
          exam_token: examToken || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setResult({
          scoreId: data.score_id,
          score: data.score,
          total: data.total,
          pourcentage: data.pourcentage,
          parties: data.parties,
          corrections: data.corrections,
          streak: data.streak,
        })
      } else {
        setError(data.error || 'Erreur lors de la soumission du quiz.')
      }
    } catch {
      setError('Impossible de joindre le serveur pour corriger le quiz.')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, reponses, mode, durationMin, coursId, moduleId, officielId, revisionScoreId, examToken])

  // Minuteur
  const timer = useTimer({
    initialSeconds: durationMin * 60,
    autoStart: false,
    onExpire: () => handleSubmitQuiz(),
  })

  // Charger les questions
  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      let endpoint = ''
      if (officielId) {
        endpoint = `/api/examen/officiel?examen=${officielId}&shuffle=${shuffleQuestions ? 1 : 0}&shuffle_props=${shuffleProps ? 1 : 0}`
      } else if (moduleId) {
        endpoint = `/api/examen/blanc?module=${moduleId}&n=20&shuffle_props=${shuffleProps ? 1 : 0}`
      } else if (revisionScoreId) {
        endpoint = `/api/questions?revision=${revisionScoreId}&shuffle_props=${shuffleProps ? 1 : 0}`
      } else if (coursId) {
        endpoint = `/api/questions?cours=${coursId}&type=qcm&shuffle_props=${shuffleProps ? 1 : 0}`
      }

      const res = await fetch(endpoint)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors du chargement des questions.')
        setLoading(false)
        return
      }

      if (officielId) {
        setExamToken(data.exam_token)
        const qcmItems = (data.items as ExamItem[])
          .filter((item) => item.kind === 'qcm')
          .map((item) => item.data as QuestionQcmClient)
        setQuestions(qcmItems)
      } else if (moduleId) {
        setExamToken(data.exam_token)
        setQuestions(data.qcm || [])
      } else {
        setQuestions(data.qcm || [])
      }

      setStarted(true)
      setCurrentStepIndex(0)
      if (mode === 'examen') {
        timer.reset(durationMin * 60)
        timer.start()
      }
    } catch {
      setError('Impossible de charger les questions.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswerForQuestion = (questionId: number, propIndex: number, isQCU: boolean) => {
    const qId = String(questionId)

    setReponses((prev) => {
      const existing = prev[qId] || []
      if (isQCU) {
        return { ...prev, [qId]: [propIndex] }
      } else {
        if (existing.includes(propIndex)) {
          return { ...prev, [qId]: existing.filter((idx) => idx !== propIndex) }
        } else {
          return { ...prev, [qId]: [...existing, propIndex].sort((a, b) => a - b) }
        }
      }
    })
  }

  const handleInstantCheckSingle = async (questionId: number): Promise<CheckAnswerResult | null> => {
    try {
      const res = await fetch('/api/quiz/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          reponses: reponses[String(questionId)] || [],
        }),
      })
      if (res.ok) {
        return await res.json()
      }
      return null
    } catch {
      return null
    }
  }

  // Écran de configuration Pré-Quiz
  if (!started && !result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-4xl">⚙️</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Configuration de la session
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personnalisez vos conditions d&apos;entraînement
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Choix du mode */}
            {!officielId && !moduleId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mode de passage
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('entrainement')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      mode === 'entrainement'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm">🎯 Entraînement</div>
                    <div className="text-xs opacity-75 mt-0.5">Correction immédiate</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('examen')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      mode === 'examen'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm">⏱️ Examen</div>
                    <div className="text-xs opacity-75 mt-0.5">Avec minuteur</div>
                  </button>
                </div>
              </div>
            )}

            {/* Durée du minuteur */}
            {(mode === 'examen' || officielId || moduleId) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Durée du chronomètre
                </label>
                <select
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes (1h)</option>
                  <option value="90">90 minutes (1h30)</option>
                </select>
              </div>
            )}

            {/* Options de mélange */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleProps}
                  onChange={(e) => setShuffleProps(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Mélanger l&apos;ordre des propositions de réponse</span>
              </label>

              {officielId && (
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mélanger l&apos;ordre des questions dans chaque partie</span>
                </label>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={loadQuestions}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition cursor-pointer"
          >
            {loading ? 'Chargement des questions...' : 'Démarrer le quiz →'}
          </button>
        </div>
      </div>
    )
  }

  // Écran de résultats
  if (result) {
    return (
      <ResultScreen
        result={result}
        onRestart={() => {
          setResult(null)
          setStarted(false)
          setReponses({})
          setCurrentStepIndex(0)
        }}
      />
    )
  }

  const currentStep = steps[currentStepIndex]

  // Calcul du nombre de questions répondues au total
  const answeredQuestionsCount = Object.keys(reponses).filter(
    (k) => (reponses[k] || []).length > 0
  ).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Barre d'état (Timer + Progression) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {mode === 'examen' ? '⏱️ Mode Examen' : '🎯 Mode Entraînement'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
              {answeredQuestionsCount} / {questions.length} questions répondues
            </span>
          </div>

          {mode === 'examen' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-mono font-bold text-sm">
              <span>⏱</span>
              <span>{timer.formatted}</span>
            </div>
          )}
        </div>

        <ProgressBar current={currentStepIndex + 1} total={steps.length} />
      </div>

      {/* Rendu dynamique de l'Étape : Cas Clinique Groupé OU Question Simple */}
      {currentStep && currentStep.type === 'case' && (
        <ClinicalCaseCard
          key={`case-${currentStep.caseGroup.caseTitle}-${currentStepIndex}`}
          caseGroup={currentStep.caseGroup}
          reponses={reponses}
          onSelectAnswer={handleSelectAnswerForQuestion}
          isExamMode={mode === 'examen'}
          onInstantCheckSingle={handleInstantCheckSingle}
        />
      )}

      {currentStep && currentStep.type === 'single' && (
        <QuestionCard
          key={`single-${currentStep.question.id}`}
          question={currentStep.question}
          selectedAnswers={reponses[String(currentStep.question.id)] || []}
          onSelectAnswer={(propIdx) =>
            handleSelectAnswerForQuestion(
              currentStep.question.id,
              propIdx,
              currentStep.question.type === 'QCU'
            )
          }
          isExamMode={mode === 'examen'}
          onInstantCheck={() => handleInstantCheckSingle(currentStep.question.id)}
        />
      )}

      {/* Navigation entre Étapes (Dossiers / Questions) */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentStepIndex === 0}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          ← Étape précédente
        </button>

        {currentStepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
            }
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            Étape suivante →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            {submitting ? 'Correction en cours...' : 'Terminer et valider le quiz ✅'}
          </button>
        )}
      </div>
    </div>
  )
}
