import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { evaluateRedaction } from '@/lib/quiz-scoring'

const schema = z.object({
  question_id: z.number().int(),
  reponse: z.string().optional().default(''),
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

    const { question_id, reponse } = parsed.data

    // Anti-triche : bloquer la correction rédactionnelle si un examen est en cours
    const activeExamSession = await prisma.examSession.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (activeExamSession) {
      return NextResponse.json(
        { error: 'Correction rédactionnelle interdite pendant un examen en cours.' },
        { status: 403 }
      )
    }

    const q = await prisma.questionRedactionnelle.findUnique({
      where: { id: question_id },
      select: {
        reponseModele: true,
        motsCles: true,
      },
    })

    if (!q) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    const motsCles = (q.motsCles as string[]) || []
    const evaluation = evaluateRedaction(reponse, q.reponseModele, motsCles)

    return NextResponse.json({
      reponse_modele: q.reponseModele,
      mots_trouves: evaluation.motsTrouves,
      mots_manques: evaluation.motsManques,
      couverture: evaluation.couverture,
    })
  } catch (error) {
    console.error('Erreur API redaction:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
