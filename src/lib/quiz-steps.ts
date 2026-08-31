import type { QuestionQcmClient } from '@/types'
import type { ClinicalCaseGroup, ParsedCaseQuestion } from '@/components/quiz/ClinicalCaseCard'

export type QuizStep =
  | { type: 'single'; question: QuestionQcmClient }
  | { type: 'case'; caseGroup: ClinicalCaseGroup }

export function parseQuestionCaseInfo(q: QuestionQcmClient): {
  isCase: boolean
  caseTitle: string
  initialObservation: string
  intermediateNotes: string[]
  questionText: string
} {
  const text = q.enonce || ''
  if (!text.includes('🏥 **Cas clinique') && !text.toLowerCase().includes('cas clinique')) {
    return {
      isCase: false,
      caseTitle: '',
      initialObservation: '',
      intermediateNotes: [],
      questionText: text,
    }
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  let caseTitle = 'Cas Clinique'
  let initialObs = ''
  const intermediateNotes: string[] = []
  const questionLines: string[] = []

  for (const line of lines) {
    // Title
    const titleMatch = line.match(/🏥\s*\*\*(Cas clinique\s*\d+.*?)\*\*/i)
    if (titleMatch) {
      caseTitle = titleMatch[1].trim()
      continue
    }

    // Initial obs (> *...*)
    if (line.startsWith('>') && line.includes('*') && !line.includes('ℹ️') && !line.includes('🏥')) {
      const cleaned = line.replace(/^[>\s\*]+/, '').replace(/[\*]+$/, '').trim()
      if (cleaned) {
        initialObs = initialObs ? `${initialObs} ${cleaned}` : cleaned
      }
      continue
    }

    // Intermediate note (> ℹ️ *...*)
    if (line.includes('ℹ️')) {
      const cleaned = line.replace(/^[>\sℹ️\*]+/, '').replace(/[\*]+$/, '').trim()
      if (cleaned) {
        intermediateNotes.push(cleaned)
      }
      continue
    }

    // Question line
    if (!line.startsWith('>')) {
      const cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
      if (cleaned) {
        questionLines.push(cleaned)
      }
    }
  }

  const questionText = questionLines.join('\n') || text

  return {
    isCase: true,
    caseTitle,
    initialObservation: initialObs,
    intermediateNotes,
    questionText,
  }
}

export function groupQuestionsIntoSteps(questions: QuestionQcmClient[]): QuizStep[] {
  const steps: QuizStep[] = []
  let i = 0;

  while (i < questions.length) {
    const q = questions[i]
    const info = parseQuestionCaseInfo(q)

    if (!info.isCase) {
      steps.push({ type: 'single', question: q })
      i++
      continue
    }

    // Group all consecutive questions with the same caseTitle
    const currentCaseTitle = info.caseTitle
    const initialObservation = info.initialObservation
    const subQuestions: ParsedCaseQuestion[] = []

    while (i < questions.length) {
      const nextQ = questions[i]
      const nextInfo = parseQuestionCaseInfo(nextQ)

      if (nextInfo.isCase && nextInfo.caseTitle.toLowerCase() === currentCaseTitle.toLowerCase()) {
        subQuestions.push({
          question: nextQ,
          questionNum: String(subQuestions.length + 1),
          questionText: nextInfo.questionText,
          intermediateNotes: nextInfo.intermediateNotes,
        })
        i++
      } else {
        break
      }
    }

    steps.push({
      type: 'case',
      caseGroup: {
        caseTitle: currentCaseTitle,
        initialObservation,
        subQuestions,
      },
    })
  }

  return steps
}
