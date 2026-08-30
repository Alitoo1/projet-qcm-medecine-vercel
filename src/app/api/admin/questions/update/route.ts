import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAdmin } from '@/lib/auth-utils'

const updateQcmSchema = z.object({
  id: z.number().int(),
  enonce: z.string().min(1),
  propositions: z.array(
    z.object({
      i: z.number().int(),
      t: z.string(),
      c: z.boolean(),
    })
  ),
  explication: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
})

const updateRedactionSchema = z.object({
  id: z.number().int(),
  enonce: z.string().min(1),
  reponseModele: z.string().optional(),
  motsCles: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAdmin()
    if ('errorResponse' in authResult) return authResult.errorResponse

    const body = await req.json()
    const { questionType = 'qcm' } = body

    if (questionType === 'qcm') {
      const parsed = updateQcmSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
      }

      const { id, enonce, propositions, explication, images } = parsed.data
      const correctCount = propositions.filter((p) => p.c).length
      const type = correctCount > 1 ? 'QCM' : 'QCU'

      const updated = await prisma.questionQcm.update({
        where: { id },
        data: {
          enonce: enonce.trim(),
          propositions,
          type,
          explication: explication ? explication.trim() : null,
          images: images ?? [],
        },
      })

      return NextResponse.json({ ok: true, question: updated })
    } else if (questionType === 'redaction') {
      const parsed = updateRedactionSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
      }

      const { id, enonce, reponseModele, motsCles, images } = parsed.data

      const updated = await prisma.questionRedactionnelle.update({
        where: { id },
        data: {
          enonce: enonce.trim(),
          reponseModele: reponseModele ? reponseModele.trim() : '',
          motsCles: motsCles ?? [],
          images: images ?? [],
        },
      })

      return NextResponse.json({ ok: true, question: updated })
    }

    return NextResponse.json({ error: 'Type de question non supporté' }, { status: 400 })
  } catch (error) {
    console.error('Erreur API update question:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
