import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/utils'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { token, password } = parsed.data
    const tokenHash = hashToken(token)

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Ce lien de réinitialisation est invalide ou a expiré.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe et marquer le jeton utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Nettoyer les tentatives de login bloquées pour cet utilisateur
      prisma.loginAttempt.deleteMany({
        where: { email: resetRecord.user.email },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur API reset-password:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
