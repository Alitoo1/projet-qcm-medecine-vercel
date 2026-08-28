import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { semestreIdForModule, userHasSemestreAccess } from '@/lib/premium'
import { generateToken, hashToken } from '@/lib/utils'
import type { Proposition, QuestionQcmClient, PropositionAvecReponse } from '@/types'

export async function GET(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const { searchParams } = new URL(req.url)
    const moduleParam = searchParams.get('module')
    const countParam = parseInt(searchParams.get('n') || '20', 10)
    const shuffleProps = searchParams.get('shuffle_props') === '1'

    if (!moduleParam) {
      return NextResponse.json({ error: 'ID du module requis' }, { status: 400 })
    }

    const moduleId = parseInt(moduleParam, 10)
    const n = Math.min(Math.max(countParam, 5), 100)

    // Vérifier accès premium
    const semId = await semestreIdForModule(moduleId)
    if (semId) {
      const hasAccess = await userHasSemestreAccess(user.id, semId, user.role === 'admin')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Accès réservé aux membres premium' }, { status: 403 })
      }
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { nom: true },
    })

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module introuvable' }, { status: 404 })
    }

    // Récupérer tous les IDs des questions publiées du module
    const availableQuestions = await prisma.questionQcm.findMany({
      where: {
        cours: {
          sousModule: { moduleId },
          estPublie: true,
        },
      },
      select: { id: true },
    })

    if (availableQuestions.length === 0) {
      return NextResponse.json({ error: 'Aucune question disponible pour ce module' }, { status: 404 })
    }

    // Tirer au sort n questions
    const shuffledIds = availableQuestions
      .map((q) => q.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, n)

    const selectedQuestions = await prisma.questionQcm.findMany({
      where: { id: { in: shuffledIds } },
    })

    // Charger les notes personnelles
    const userNotes = await prisma.noteQuestion.findMany({
      where: {
        userId: user.id,
        questionType: 'qcm',
        questionId: { in: shuffledIds },
      },
    })
    const notesMap = new Map(userNotes.map((n) => [n.questionId, n.contenu]))

    const clientQuestions: QuestionQcmClient[] = selectedQuestions.map((q) => {
      const fullProps = (q.propositions as unknown as PropositionAvecReponse[]) || []
      let clientProps: Proposition[] = fullProps.map((p, idx) => ({
        i: idx,
        t: p.t,
      }))

      if (shuffleProps) {
        clientProps = [...clientProps].sort(() => Math.random() - 0.5)
      }

      return {
        id: q.id,
        type: q.type,
        enonce: q.enonce,
        propositions: clientProps,
        images: (q.images as string[]) || [],
        note: notesMap.get(q.id) || '',
      }
    })

    // Anti-triche serverless : créer un enregistrement ExamSession
    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 heures

    await prisma.examSession.create({
      data: {
        userId: user.id,
        type: 'blanc',
        payload: {
          moduleId,
          questionIds: shuffledIds,
          shuffleProps,
        },
        tokenHash,
        expiresAt,
      },
    })

    return NextResponse.json({
      module_id: moduleId,
      module_nom: moduleRecord.nom,
      exam_token: rawToken,
      qcm: clientQuestions,
      redaction: [],
    })
  } catch (error) {
    console.error('Erreur API exam_start:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
