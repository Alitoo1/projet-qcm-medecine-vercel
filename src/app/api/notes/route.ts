import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  questionType: z.enum(['qcm', 'redaction']),
  questionId: z.number().int(),
  contenu: z.string().max(1000),
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

    const { questionType, questionId, contenu } = parsed.data

    if (contenu.trim() === '') {
      await prisma.noteQuestion.deleteMany({
        where: {
          userId: user.id,
          questionType,
          questionId,
        },
      })
      return NextResponse.json({ ok: true, deleted: true })
    }

    await prisma.noteQuestion.upsert({
      where: {
        userId_questionType_questionId: {
          userId: user.id,
          questionType,
          questionId,
        },
      },
      update: { contenu: contenu.trim() },
      create: {
        userId: user.id,
        questionType,
        questionId,
        contenu: contenu.trim(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur API notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
