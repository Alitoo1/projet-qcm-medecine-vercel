import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAdmin } from '@/lib/auth-utils'

const questionSchema = z.object({
  cours_id: z.number().int().optional(),
  partie_id: z.number().int().optional(),
  type: z.enum(['QCU', 'QCM']).default('QCU'),
  enonce: z.string().min(1),
  propositions: z.array(
    z.object({
      t: z.string(),
      c: z.boolean(),
    })
  ).min(2),
  explication: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin()
    if ('errorResponse' in adminCheck) return adminCheck.errorResponse

    const body = await req.json()
    const rawList = Array.isArray(body.data) ? body.data : [body.data]

    const parsedQuestions = []
    for (const item of rawList) {
      const parsed = questionSchema.safeParse(item)
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Format invalide pour la question : ${JSON.stringify(item)}` },
          { status: 400 }
        )
      }
      parsedQuestions.push(parsed.data)
    }

    // Insérer dans une transaction
    await prisma.$transaction(
      parsedQuestions.map((q) =>
        prisma.questionQcm.create({
          data: {
            coursId: q.cours_id || null,
            partieId: q.partie_id || null,
            type: q.type,
            enonce: q.enonce,
            propositions: q.propositions,
            explication: q.explication || null,
            images: q.images ?? undefined,
          },
        })
      )
    )

    return NextResponse.json({ ok: true, count: parsedQuestions.length })
  } catch (error) {
    console.error('Erreur API import:', error)
    return NextResponse.json({ error: 'Erreur serveur lors de l&apos;import' }, { status: 500 })
  }
}
