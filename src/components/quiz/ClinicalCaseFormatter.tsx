'use client'

import React from 'react'

interface ClinicalCaseFormatterProps {
  text: string
  className?: string
}

function cleanMarkdown(str: string): string {
  if (!str) return ''
  return str
    .replace(/^>\s*/gm, '')
    .replace(/🏥/g, '')
    .replace(/ℹ️/g, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*([^\*]+)\*(\s|$)/g, '$1$2$3')
    .replace(/\*/g, '')
    .trim()
}

export function ClinicalCaseFormatter({ text, className = '' }: ClinicalCaseFormatterProps) {
  if (!text) return null

  const isCase =
    text.toLowerCase().includes('cas clinique') ||
    text.toLowerCase().includes('anamnèse') ||
    text.toLowerCase().includes('constantes') ||
    (text.toLowerCase().includes('patient') && (text.includes('mmHg') || text.includes('bpm') || text.includes('SpO2') || text.includes('ECG') || text.includes('ALAT')))

  if (!isCase) {
    return (
      <div className={`text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line ${className}`}>
        {cleanMarkdown(text)}
      </div>
    )
  }

  // Si c'est un cas clinique, on découpe le texte pour isoler la vignette et la question
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let title = 'Cas Clinique'
  const patientHistory: string[] = []
  const vitals: { label: string; value: string; color: string }[] = []
  const physicalExam: string[] = []
  const paraclinical: string[] = []
  const questionLines: string[] = []

  let currentSection: 'history' | 'vitals' | 'physical' | 'paraclinical' | 'question' = 'history'

  for (const rawLine of rawLines) {
    const line = cleanMarkdown(rawLine)
    if (!line) continue
    const lower = line.toLowerCase()

    // Titre de cas clinique
    if (lower.startsWith('cas clinique') || lower.includes('cas clinique :') || lower.includes('cas clinique 1') || lower.includes('cas clinique 2')) {
      title = line.replace(/[:\-]+$/, '').trim()
      continue
    }

    // Détection de question finale
    if (
      lower.startsWith('question') ||
      lower.startsWith('quel ') ||
      lower.startsWith('quelle ') ||
      lower.startsWith('quels ') ||
      lower.startsWith('quelles ') ||
      lower.startsWith('s\'agit-il') ||
      lower.startsWith('est-ce qu') ||
      lower.startsWith('citez ') ||
      lower.startsWith('décrire ') ||
      lower.startsWith('énumérez ') ||
      /^\d+[\.\-\:]\s*(quel|quelle|quels|quelles|parmi|comment|est|s'agit|indiquez|choisissez)/i.test(line)
    ) {
      currentSection = 'question'
      questionLines.push(line)
      continue
    }

    // Détection de section Constantes
    if (lower.includes('constantes') || lower.includes('signes vitaux')) {
      currentSection = 'vitals'
      continue
    }

    // Détection de section Examen clinique
    if (lower.includes('examen clinique') || lower.includes('signes spécifiques') || lower.includes('présentation clinique')) {
      currentSection = 'physical'
      continue
    }

    // Détection de section Biologie / Paraclinique / Imagerie
    if (lower.includes('examens complémentaires') || lower.includes('biologie') || lower.includes('dosage') || lower.includes('imagerie') || lower.includes('ecg') || lower.includes('scanner a été') || lower.includes('tdm')) {
      currentSection = 'paraclinical'
      if (!lower.startsWith('●') && !lower.startsWith('○') && !lower.startsWith('-')) {
        paraclinical.push(line)
        continue
      }
    }

    // Parser les constantes vitales
    if (line.includes('TA :') || line.includes('TA:') || lower.includes('tension')) {
      vitals.push({ label: 'Tension Artérielle', value: line.replace(/^.*?TA\s*:\s*/i, '').replace(/^.*?Tension artérielle\s*:\s*/i, '').trim(), color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' })
      continue
    }
    if (line.includes('FC :') || line.includes('FC:') || lower.includes('fréquence cardiaque')) {
      vitals.push({ label: 'Fréquence Cardiaque', value: line.replace(/^.*?FC\s*:\s*/i, '').replace(/^.*?Fréquence cardiaque\s*:\s*/i, '').trim(), color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' })
      continue
    }
    if (line.includes('FR :') || line.includes('FR:') || lower.includes('fréquence respiratoire')) {
      vitals.push({ label: 'Fréquence Resp.', value: line.replace(/^.*?FR\s*:\s*/i, '').replace(/^.*?Fréquence respiratoire\s*:\s*/i, '').trim(), color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' })
      continue
    }
    if (lower.includes('température') || lower.includes('température:') || lower.includes('température :')) {
      vitals.push({ label: 'Température', value: line.replace(/^.*?Température\s*:\s*/i, '').trim(), color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' })
      continue
    }
    if (lower.includes('spo2') || lower.includes('saturation')) {
      vitals.push({ label: 'Saturation O₂', value: line.replace(/^.*?SpO2\s*:\s*/i, '').replace(/^.*?Saturation en 02:\s*/i, '').trim(), color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' })
      continue
    }

    // Répartition selon section courante
    if (currentSection === 'question') {
      questionLines.push(line)
    } else if (currentSection === 'vitals') {
      physicalExam.push(line.replace(/^[●○\-]\s*/, ''))
    } else if (currentSection === 'physical') {
      physicalExam.push(line.replace(/^[●○\-]\s*/, ''))
    } else if (currentSection === 'paraclinical') {
      paraclinical.push(line.replace(/^[●○\-]\s*/, ''))
    } else {
      patientHistory.push(line.replace(/^[●○\-]\s*/, ''))
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dossier Clinique Container */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900/90 dark:to-indigo-950/30 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Badge d'en-tête */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
            <span>📋</span> {title}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Dossier Patient
          </span>
        </div>

        {/* Anamnèse / Histoire de la maladie */}
        {patientHistory.length > 0 && (
          <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed space-y-1.5">
            {patientHistory.map((p, idx) => (
              <p key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold text-sm mt-0.5">•</span>
                <span>{p}</span>
              </p>
            ))}
          </div>
        )}

        {/* Constantes vitales en pill-badges */}
        {vitals.length > 0 && (
          <div className="pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>🩺</span> Constantes & Signes Vitaux
            </div>
            <div className="flex flex-wrap gap-2.5">
              {vitals.map((v, idx) => (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${v.color}`}
                >
                  <span className="opacity-75">{v.label} :</span>
                  <span className="font-bold">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examen physique */}
        {physicalExam.length > 0 && (
          <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>🔍</span> Examen Physique & Signes d'Appel
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {physicalExam.map((sign, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-indigo-500 font-bold">✓</span>
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biologie / Imagerie / Paraclinique */}
        {paraclinical.length > 0 && (
          <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>🧪</span> Examens Paracliniques & Biologie
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
              {paraclinical.map((exam, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">⚡</span>
                  <span>{exam}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Carte Question finale */}
      {questionLines.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-500/40 dark:border-teal-500/30 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              <span>❓</span> QUESTION POSÉE
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
            {questionLines.join('\n')}
          </div>
        </div>
      )}
    </div>
  )
}
