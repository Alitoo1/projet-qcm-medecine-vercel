import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
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

    const { currentPassword, newPassword } = parsed.data

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
