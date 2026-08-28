import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  annee: z.number().int().min(1).max(6),
})

export async function PUT(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { nom, prenom, annee } = parsed.data

    await prisma.user.update({
      where: { id: user.id },
      data: { nom, prenom, annee },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur update account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
