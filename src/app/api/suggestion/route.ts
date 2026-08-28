import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  contenu: z.string().min(10).max(2000),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Message invalide (10 à 2000 caractères)' }, { status: 400 })
    }

    // Limiter à 5 suggestions par jour par utilisateur
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const countToday = await prisma.suggestion.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    })

    if (countToday >= 5) {
      return NextResponse.json(
        { error: 'Limite quotidienne atteinte (max 5 suggestions par jour).' },
        { status: 429 }
      )
    }

    await prisma.suggestion.create({
      data: {
        userId: user.id,
        contenu: parsed.data.contenu,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur API suggestion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
