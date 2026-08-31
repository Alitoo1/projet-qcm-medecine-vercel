'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavoriteButton } from '../widgets/FavoriteButton'
import { NoteWidget } from '../widgets/NoteWidget'
import { ReportWidget } from '../widgets/ReportWidget'
import { ClinicalCaseFormatter } from './ClinicalCaseFormatter'
import type { QuestionRedactionClient } from '@/types'

interface RedactionCardProps {
  question: QuestionRedactionClient
  isExamMode?: boolean
}

export function RedactionCard({ question, isExamMode }: RedactionCardProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const [checking, setChecking] = useState(false)
  const [evaluation, setEvaluation] = useState<{
    reponseModele?: string
    motsTrouves?: string[]
    motsManques?: string[]
    couverture?: number
  } | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleEvaluate = async () => {
    if (checking) return
    setChecking(true)
    try {
      const res = await fetch('/api/quiz/redaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          reponse: userAnswer,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEvaluation({
          reponseModele: data.reponse_modele,
          motsTrouves: data.mots_trouves,
          motsManques: data.mots_manques,
          couverture: data.couverture,
        })
        setShowCorrection(true)
      }
    } catch {
      setShowCorrection(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* En-tête de question */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
          ✍️ Question Rédactionnelle / QROC
        </span>

        <div className="flex items-center gap-2">
          <FavoriteButton
            questionType="redaction"
            questionId={question.id}
            initialFavori={question.favori}
          />
          <ReportWidget questionType="redaction" questionId={question.id} />
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

      {/* Zone de saisie étudiant */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Votre réponse rédigée :
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Rédigez vos éléments de réponse, mots-clés ou justification ici..."
          rows={4}
          disabled={showCorrection && isExamMode}
          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-y"
        />
      </div>

      {/* Bouton d'évaluation */}
      {!isExamMode && !showCorrection && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={checking}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{checking ? 'Évaluation...' : 'Valider & voir le corrigé'}</span>
            <span>🔍</span>
          </button>
        </div>
      )}

      {/* Corrigé / Évaluation */}
      {showCorrection && (
        <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <span>📋</span> Éléments de correction & Mots-clés
            </span>
            {evaluation?.couverture !== undefined && evaluation.couverture > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                Score mots-clés : {evaluation.couverture}%
              </span>
            )}
          </div>

          {evaluation?.reponseModele ? (
            <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {evaluation.reponseModele}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              Question ouverte d&apos;entraînement. Comparez vos éléments de réponse avec vos supports de cours de référence.
            </p>
          )}

          {evaluation?.motsTrouves && evaluation.motsTrouves.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                ✅ Mots-clés retrouvés :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.motsTrouves.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note personnelle */}
      <NoteWidget
        questionType="redaction"
        questionId={question.id}
        initialNote={question.note}
      />
    </div>
  )
}
