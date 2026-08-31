import type { QuestionQcmClient } from '@/types'
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

export function parseQuestionCaseInfo(q: QuestionQcmClient): {
  isCase: boolean
  caseTitle: string
  initialObservation: string
  intermediateNotes: string[]
  questionText: string
} {
  const text = q.enonce || ''
  if (!text.includes('🏥') && !text.toLowerCase().includes('cas clinique')) {
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

  for (const line of lines) {
    // Title
    const titleMatch = line.match(/(?:🏥\s*)?(?:\*\*)?(Cas clinique\s*\d+.*?)(?:\*\*)?$/i)
    if (titleMatch) {
      caseTitle = cleanMarkdown(titleMatch[1])
      continue
    }

    // Initial obs (> *...*)
    if (line.startsWith('>') && !line.includes('ℹ️') && !line.includes('🏥')) {
      const cleaned = cleanMarkdown(line)
      if (cleaned) {
        initialObs = initialObs ? `${initialObs} ${cleaned}` : cleaned
      }
      continue
    }

    // Intermediate note (> ℹ️ *...*)
    if (line.includes('ℹ️')) {
      const cleaned = cleanMarkdown(line)
      if (cleaned) {
        intermediateNotes.push(cleaned)
      }
      continue
    }

    // Question line
    if (!line.startsWith('>')) {
      const cleaned = cleanMarkdown(line)
      if (cleaned) {
        questionLines.push(cleaned)
      }
    }
  }

  const questionText = questionLines.join('\n') || cleanMarkdown(text)

  return {
    isCase: true,
    caseTitle: cleanMarkdown(caseTitle),
    initialObservation: cleanMarkdown(initialObs),
    intermediateNotes: intermediateNotes.map(cleanMarkdown),
    questionText: cleanMarkdown(questionText),
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
