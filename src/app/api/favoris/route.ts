import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  questionType: z.enum(['qcm', 'redaction']),
  questionId: z.number().int(),
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

    const { questionType, questionId } = parsed.data

    const existing = await prisma.favori.findUnique({
      where: {
        userId_questionType_questionId: {
          userId: user.id,
          questionType,
          questionId,
        },
      },
    })

    if (existing) {
      await prisma.favori.delete({ where: { id: existing.id } })
      return NextResponse.json({ favorited: false })
    } else {
      await prisma.favori.create({
        data: {
          userId: user.id,
          questionType,
          questionId,
        },
      })
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error('Erreur API favoris:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
