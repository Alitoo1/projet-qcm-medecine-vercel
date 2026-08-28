import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'

const schema = z.object({
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
    }

    const { password } = parsed.data

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, role: true },
    })

    if (!dbUser || !(await bcrypt.compare(password, dbUser.passwordHash))) {
      return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 400 })
    }

    // Sécurité : interdire la suppression s'il est le dernier administrateur
    if (dbUser.role === 'admin') {
      const adminsCount = await prisma.user.count({ where: { role: 'admin' } })
      if (adminsCount <= 1) {
        return NextResponse.json(
          { error: 'Impossible de supprimer le seul compte administrateur restant.' },
          { status: 403 }
        )
      }
    }

    // Suppression en cascade (gérée par les relations Prisma onDelete: Cascade)
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression compte:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
