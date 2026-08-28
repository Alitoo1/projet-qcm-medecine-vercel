import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { semestreIdForModule, userHasSemestreAccess } from '@/lib/premium'
import { generateToken, hashToken } from '@/lib/utils'
import type { ExamItem, Proposition, QuestionQcmClient, QuestionRedactionClient, PropositionAvecReponse } from '@/types'

export async function GET(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const { searchParams } = new URL(req.url)
    const examenParam = searchParams.get('examen')
    const shuffleQuestions = searchParams.get('shuffle') === '1'
    const shuffleProps = searchParams.get('shuffle_props') === '1'

    if (!examenParam) {
      return NextResponse.json({ error: "ID de l'examen requis" }, { status: 400 })
    }

    const examenId = parseInt(examenParam, 10)

    const examen = await prisma.examenOfficiel.findUnique({
      where: { id: examenId },
      include: {
        module: true,
        parties: {
          orderBy: { ordre: 'asc' },
          include: {
            questionsQcm: { orderBy: { id: 'asc' } },
            questionsRedaction: { orderBy: { id: 'asc' } },
          },
        },
      },
    })

    if (!examen || (!examen.estPublie && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Examen introuvable ou non publié' }, { status: 404 })
    }

    // Vérifier accès premium
    const semId = await semestreIdForModule(examen.moduleId)
    if (semId) {
      const hasAccess = await userHasSemestreAccess(user.id, semId, user.role === 'admin')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Accès réservé aux membres premium' }, { status: 403 })
      }
    }

    const items: ExamItem[] = []
    const allQcmIds: number[] = []
    const partieCount = examen.parties.length

    examen.parties.forEach((partie, pIndex) => {
      let qcms = [...partie.questionsQcm]
      if (shuffleQuestions) {
        qcms = qcms.sort(() => Math.random() - 0.5)
      }

      qcms.forEach((q) => {
        allQcmIds.push(q.id)
        const fullProps = (q.propositions as unknown as PropositionAvecReponse[]) || []
        let clientProps: Proposition[] = fullProps.map((p, idx) => ({
          i: idx,
          t: p.t,
        }))

        if (shuffleProps) {
          clientProps = [...clientProps].sort(() => Math.random() - 0.5)
        }

        const data: QuestionQcmClient = {
          id: q.id,
          type: q.type,
          enonce: q.enonce,
          propositions: clientProps,
          images: (q.images as string[]) || [],
        }

        items.push({
          kind: 'qcm',
          partie: partie.nom,
          partieIndex: pIndex + 1,
          partieCount,
          data,
        })
      })

      partie.questionsRedaction.forEach((r) => {
        const data: QuestionRedactionClient = {
          id: r.id,
          enonce: r.enonce,
          images: (r.images as string[]) || [],
        }

        items.push({
          kind: 'redaction',
          partie: partie.nom,
          partieIndex: pIndex + 1,
          partieCount,
          data,
        })
      })
    })

    // Anti-triche serverless session
    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000)

    await prisma.examSession.create({
      data: {
        userId: user.id,
        type: 'officiel',
        payload: {
          examenId,
          questionIds: allQcmIds,
          shuffleProps,
        },
        tokenHash,
        expiresAt,
      },
    })

    return NextResponse.json({
      examen_id: examen.id,
      titre: examen.titre,
      exam_token: rawToken,
      items,
    })
  } catch (error) {
    console.error('Erreur API officiel_start:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
