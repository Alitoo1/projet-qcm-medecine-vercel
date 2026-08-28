import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  questionType: z.enum(['qcm', 'redaction']),
  questionId: z.number().int(),
  motif: z.enum(['reponse_fausse', 'enonce_ambigu', 'faute_frappe', 'autre']),
  commentaire: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const { questionType, questionId, motif, commentaire } = parsed.data

    await prisma.signalement.create({
      data: {
        userId: user.id,
        questionType,
        questionId,
        motif,
        commentaire: commentaire || null,
        statut: 'nouveau',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur API signaler:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
