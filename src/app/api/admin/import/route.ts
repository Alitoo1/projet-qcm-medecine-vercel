import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAdmin } from '@/lib/auth-utils'

const qcmSchema = z.object({
  cours_id: z.number().int().optional(),
  coursId: z.number().int().optional(),
  partie_id: z.number().int().optional(),
  partieId: z.number().int().optional(),
  type: z.enum(['QCU', 'QCM', 'qcu', 'qcm']).optional(),
  enonce: z.string().min(1),
  propositions: z.array(
    z.object({
      t: z.string(),
      c: z.boolean().default(false),
    })
  ).min(2),
  explication: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
})

const redactionSchema = z.object({
  cours_id: z.number().int().optional(),
  coursId: z.number().int().optional(),
  partie_id: z.number().int().optional(),
  partieId: z.number().int().optional(),
  type: z.enum(['redaction', 'QR', 'QROC', 'qroc']).optional(),
  enonce: z.string().min(1),
  reponse_modele: z.string().optional(),
  reponseModele: z.string().optional(),
  mots_cles: z.array(z.string()).optional(),
  motsCles: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin()
    if ('errorResponse' in adminCheck) return adminCheck.errorResponse

    const body = await req.json()
    const rawList = Array.isArray(body.data) ? body.data : [body.data]

    let qcmInserted = 0
    let redactionInserted = 0

    for (const item of rawList) {
      // 1. Tenter comme Question Rédactionnelle si champ reponseModele ou type redaction
      if (item.type === 'redaction' || item.type === 'QR' || item.type === 'QROC' || item.reponseModele !== undefined || item.reponse_modele !== undefined) {
        const parsed = redactionSchema.safeParse(item)
        if (!parsed.success) {
          return NextResponse.json(
            { error: `Format invalide pour la question rédactionnelle : ${JSON.stringify(item)}` },
            { status: 400 }
          )
        }
        const data = parsed.data
        const targetCoursId = data.coursId ?? data.cours_id ?? null
        const targetPartieId = data.partieId ?? data.partie_id ?? null
        const modelAnswer = data.reponseModele ?? data.reponse_modele ?? ''
        const keywords = data.motsCles ?? data.mots_cles ?? []

        await prisma.questionRedactionnelle.create({
          data: {
            coursId: targetCoursId,
            partieId: targetPartieId,
            enonce: data.enonce.trim(),
            reponseModele: modelAnswer.trim(),
            motsCles: keywords,
            images: data.images ?? [],
          },
        })
        redactionInserted++
      } else {
        // 2. Traiter comme QCM
        const parsed = qcmSchema.safeParse(item)
        if (!parsed.success) {
          return NextResponse.json(
            { error: `Format invalide pour le QCM : ${JSON.stringify(item)}` },
            { status: 400 }
          )
        }
        const data = parsed.data
        const targetCoursId = data.coursId ?? data.cours_id ?? null
        const targetPartieId = data.partieId ?? data.partie_id ?? null

        const props = data.propositions.map((p, idx) => ({
          i: idx,
          t: p.t.trim(),
          c: !!p.c,
        }))

        const correctCount = props.filter((p) => p.c).length
        const determinedType = data.type ? (data.type.toUpperCase() as 'QCU' | 'QCM') : correctCount > 1 ? 'QCM' : 'QCU'

        await prisma.questionQcm.create({
          data: {
            coursId: targetCoursId,
            partieId: targetPartieId,
            type: determinedType,
            enonce: data.enonce.trim(),
            propositions: props,
            explication: data.explication ? data.explication.trim() : null,
            images: data.images ?? [],
          },
        })
        qcmInserted++
      }
    }

    return NextResponse.json({
      ok: true,
      count: qcmInserted + redactionInserted,
      qcmCount: qcmInserted,
      redactionCount: redactionInserted,
    })
  } catch (error) {
    console.error('Erreur API import:', error)
    return NextResponse.json({ error: 'Erreur serveur lors de l&apos;import' }, { status: 500 })
  }
}
