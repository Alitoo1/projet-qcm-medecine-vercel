import { QuizEngine } from '@/components/quiz/QuizEngine'

interface PageProps {
  searchParams: Promise<{
    cours?: string
    module?: string
    officiel?: string
    revision?: string
    type?: 'qcm' | 'redaction' | 'all'
  }>
}

export default async function QuizPage({ searchParams }: PageProps) {
  const params = await searchParams

  const coursId = params.cours ? parseInt(params.cours, 10) : undefined
  const moduleId = params.module ? parseInt(params.module, 10) : undefined
  const officielId = params.officiel ? parseInt(params.officiel, 10) : undefined
  const revisionScoreId = params.revision ? parseInt(params.revision, 10) : undefined
  const questionType = params.type || (coursId ? undefined : 'qcm')

  return (
    <QuizEngine
      coursId={coursId}
      moduleId={moduleId}
      officielId={officielId}
      revisionScoreId={revisionScoreId}
      initialQuestionType={questionType}
    />
  )
}
