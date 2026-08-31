import type { QuestionQcmClient, QuestionRedactionClient } from '@/types'
import type { ClinicalCaseGroup, ParsedCaseQuestion } from '@/components/quiz/ClinicalCaseCard'

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

export type QuizStep =
  | { type: 'single'; question: QuestionQcmClient }
  | { type: 'case'; caseGroup: ClinicalCaseGroup }

export interface ParsedRedactionCaseQuestion {
  question: QuestionRedactionClient
  questionNum: string
  questionText: string
  intermediateNotes: string[]
}

export interface RedactionCaseGroup {
  caseTitle: string
  initialObservation: string
  subQuestions: ParsedRedactionCaseQuestion[]
}

export type RedactionQuizStep =
  | { type: 'single'; question: QuestionRedactionClient }
  | { type: 'case'; caseGroup: RedactionCaseGroup }

export function parseQuestionCaseInfo(q: { enonce: string }): {
  isCase: boolean
  caseTitle: string
  initialObservation: string
  intermediateNotes: string[]
  questionText: string
} {
  const text = q.enonce || ''
  if (!text.includes('🏥') && !text.toLowerCase().includes('cas clinique') && !text.toLowerCase().includes('ecg ')) {
    return {
      isCase: false,
      caseTitle: '',
      initialObservation: '',
      intermediateNotes: [],
      questionText: cleanMarkdown(text),
    }
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  let caseTitle = 'Cas Clinique'
  let initialObs = ''
  const intermediateNotes: string[] = []
  const questionLines: string[] = []
  let foundQuestionLine = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = cleanMarkdown(rawLine)

    // Title on first line
    const titleMatch = rawLine.match(/^(?:🏥\s*)?(?:\*\*)?(Cas clinique\s*\d+.*?|ECG\s*\d+.*?)(?:\*\*)?$/i)
    if (titleMatch && i === 0) {
      caseTitle = cleanMarkdown(titleMatch[1].replace(/:$/, ''))
      continue
    }

    // Legacy Intermediate note with ℹ️
    if (rawLine.includes('ℹ️')) {
      if (line) intermediateNotes.push(line)
      continue
    }

    // Question start line detection: starts with "1-", "1.", "QR 1 :", etc.
    const isQuestionStart = rawLine.match(/^(\d+\s*[\-\.]\s+|QR\s*\d+\s*:)/i)
    if (isQuestionStart) {
      foundQuestionLine = true
    }

    if (foundQuestionLine) {
      questionLines.push(line)
    } else {
      // Belongs to initial observation
      if (initialObs) {
        initialObs += '\n' + line
      } else {
        initialObs = line
      }
    }
  }

  // Fallback if no question start detected
  let finalQuestionText = questionLines.join('\n')
  if (!finalQuestionText) {
    if (initialObs) {
      finalQuestionText = initialObs
      initialObs = ''
    } else {
      finalQuestionText = cleanMarkdown(text)
    }
  }

  return {
    isCase: true,
    caseTitle: cleanMarkdown(caseTitle),
    initialObservation: cleanMarkdown(initialObs),
    intermediateNotes: intermediateNotes.map(cleanMarkdown),
    questionText: cleanMarkdown(finalQuestionText),
  }
}

export function groupQuestionsIntoSteps(questions: QuestionQcmClient[]): QuizStep[] {
  const steps: QuizStep[] = []
  let i = 0

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

export function groupRedactionQuestionsIntoSteps(questions: QuestionRedactionClient[]): RedactionQuizStep[] {
  const steps: RedactionQuizStep[] = []
  let i = 0

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
    const subQuestions: ParsedRedactionCaseQuestion[] = []

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
