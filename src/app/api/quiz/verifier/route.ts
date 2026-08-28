import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { scoreQuestion } from '@/lib/quiz-scoring'
import type { PropositionAvecReponse } from '@/types'

const schema = z.object({
  question_id: z.number().int(),
  reponses: z.union([z.array(z.number().int()), z.number().int()]).optional(),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètre question_id manquant' }, { status: 400 })
    }

    const { question_id, reponses } = parsed.data
    const reponsesList = Array.isArray(reponses) ? reponses : typeof reponses === 'number' ? [reponses] : []

    // Anti-triche : bloquer la vérification instantanée si la question fait partie d'un examen actif
    const activeExamSession = await prisma.examSession.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (activeExamSession) {
      const payload = activeExamSession.payload as { questionIds?: number[] } | null
      if (payload?.questionIds?.includes(question_id)) {
        return NextResponse.json(
          { error: 'Vérification instantanée interdite pendant un examen en cours.' },
          { status: 403 }
        )
      }
    }

    const q = await prisma.questionQcm.findUnique({
      where: { id: question_id },
      select: {
        propositions: true,
        explication: true,
      },
    })

    if (!q) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    const fullProps = (q.propositions as unknown as PropositionAvecReponse[]) || []
    const { correct, bonnesReponses } = scoreQuestion(fullProps, reponsesList)

    return NextResponse.json({
      correct,
      bonnes_reponses: bonnesReponses,
      explication: q.explication || null,
    })
  } catch (error) {
    console.error('Erreur API verifier:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
