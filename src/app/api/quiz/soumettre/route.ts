import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { scoreQuestion } from '@/lib/quiz-scoring'
import { updateUserStreak } from '@/lib/streak'
import { hashToken } from '@/lib/utils'
import type { ModeScore, PropositionAvecReponse, QuizCorrection, PartieScore } from '@/types'

const schema = z.object({
  reponses: z.record(z.string(), z.array(z.number().int())),
  duree: z.number().int().optional(),
  cours_id: z.number().int().optional(),
  mode: z.enum(['entrainement', 'examen', 'revision']).optional(),
  exam_module_id: z.number().int().optional(),
  officiel_examen_id: z.number().int().optional(),
  revision_score_id: z.number().int().optional(),
  exam_token: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const {
      reponses,
      duree,
      cours_id,
      mode = 'entrainement',
      exam_module_id,
      officiel_examen_id,
      revision_score_id,
      exam_token,
    } = parsed.data

    let questionIds: number[] = []
    let resolvedMode: ModeScore = mode as ModeScore
    let finalCoursId: number | null = cours_id || null
    let finalModuleId: number | null = exam_module_id || null
    let finalOfficielId: number | null = officiel_examen_id || null
    let shuffleProps = false

    // ── Validation du contexte & Anti-triche ──
    if (officiel_examen_id) {
      if (!exam_token) {
        return NextResponse.json({ error: "Jeton d'examen requis" }, { status: 400 })
      }
      const tokenHash = hashToken(exam_token)
      const session = await prisma.examSession.findFirst({
        where: {
          tokenHash,
          userId: user.id,
          type: 'officiel',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
      })

      if (!session) {
        return NextResponse.json({ error: "Session d'examen expirée ou invalide" }, { status: 400 })
      }

      const payload = session.payload as { examenId: number; questionIds: number[]; shuffleProps: boolean }
      questionIds = payload.questionIds
      shuffleProps = payload.shuffleProps
      finalOfficielId = payload.examenId
      resolvedMode = 'examen'

      // Invalider la session à usage unique
      await prisma.examSession.update({
        where: { id: session.id },
        data: { consumedAt: new Date() },
      })
    } else if (exam_module_id) {
      if (!exam_token) {
        return NextResponse.json({ error: "Jeton d'examen requis" }, { status: 400 })
      }
      const tokenHash = hashToken(exam_token)
      const session = await prisma.examSession.findFirst({
        where: {
          tokenHash,
          userId: user.id,
          type: 'blanc',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
      })

      if (!session) {
        return NextResponse.json({ error: "Session d'examen expirée ou invalide" }, { status: 400 })
      }

      const payload = session.payload as { moduleId: number; questionIds: number[]; shuffleProps: boolean }
      questionIds = payload.questionIds
      shuffleProps = payload.shuffleProps
      finalModuleId = payload.moduleId
      resolvedMode = 'examen'

      await prisma.examSession.update({
        where: { id: session.id },
        data: { consumedAt: new Date() },
      })
    } else if (revision_score_id) {
      const originalScore = await prisma.score.findFirst({
        where: { id: revision_score_id, userId: user.id },
      })
      if (!originalScore || !originalScore.erreursIds) {
        return NextResponse.json({ error: 'Score de révision introuvable' }, { status: 404 })
      }

      try {
        questionIds = JSON.parse(originalScore.erreursIds) as number[]
      } catch {
        questionIds = []
      }

      finalCoursId = originalScore.coursId
      finalModuleId = originalScore.moduleId
      finalOfficielId = originalScore.examenOfficielId
      resolvedMode = 'revision'
    } else if (cours_id) {
      const coursQuestions = await prisma.questionQcm.findMany({
        where: { coursId: cours_id },
        select: { id: true },
        orderBy: { id: 'asc' },
      })
      questionIds = coursQuestions.map((q) => q.id)
    } else {
      return NextResponse.json({ error: 'Contexte de quiz manquant' }, { status: 400 })
    }

    if (questionIds.length === 0) {
      return NextResponse.json({ error: 'Aucune question à corriger' }, { status: 400 })
    }

    // ── Charger les questions complètes depuis la base ──
    const questions = await prisma.questionQcm.findMany({
      where: { id: { in: questionIds } },
      include: {
        partie: true,
      },
    })

    const questionsMap = new Map(questions.map((q) => [q.id, q]))

    let totalScore = 0
    const totalQuestions = questionIds.length
    const erreurs: number[] = []
    const corrections: QuizCorrection[] = []
    const reponsesLogs: { questionId: number; userId: number; correct: boolean }[] = []
    const partiesScoresMap = new Map<string, { nom: string; score: number; total: number }>()

    for (const qId of questionIds) {
      const q = questionsMap.get(qId)
      if (!q) continue

      const fullProps = (q.propositions as unknown as PropositionAvecReponse[]) || []
      const userAns = reponses[String(qId)] || []

      const { correct, bonnesReponses } = scoreQuestion(fullProps, userAns)

      if (correct) {
        totalScore++
      } else {
        erreurs.push(qId)
      }

      corrections.push({
        questionId: qId,
        correct,
        bonnesReponses,
        reponsesDonnees: userAns,
        explication: q.explication || null,
      })

      // Journaliser pour les statistiques de difficulté (sauf en révision)
      if (resolvedMode !== 'revision') {
        reponsesLogs.push({
          questionId: qId,
          userId: user.id,
          correct,
        })
      }

      // Progression par partie (examens officiels)
      if (q.partie) {
        const pNom = q.partie.nom
        if (!partiesScoresMap.has(pNom)) {
          partiesScoresMap.set(pNom, { nom: pNom, score: 0, total: 0 })
        }
        const pStat = partiesScoresMap.get(pNom)!
        pStat.total++
        if (correct) pStat.score++
      }
    }

    const pourcentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0
    const partiesList: PartieScore[] = Array.from(partiesScoresMap.values())

    // ── Enregistrement dans la base ──
    const reponsesData = JSON.stringify({
      ids: questionIds,
      reponses,
      shuffle_props: shuffleProps,
    })

    const scoreRecord = await prisma.score.create({
      data: {
        userId: user.id,
        coursId: finalCoursId,
        moduleId: finalModuleId,
        examenOfficielId: finalOfficielId,
        score: totalScore,
        total: totalQuestions,
        pourcentage: Math.round(pourcentage * 100) / 100,
        dureeSecondes: duree || null,
        mode: resolvedMode,
        erreursIds: JSON.stringify(erreurs),
        partiesScores: partiesList.length > 0 ? JSON.stringify(partiesList) : null,
        reponsesData,
      },
    })

    // Enregistrer les logs de réponses
    if (reponsesLogs.length > 0) {
      await prisma.reponseLog.createMany({
        data: reponsesLogs,
      })
    }

    // Mettre à jour le streak quotidien
    const newStreak = await updateUserStreak(user.id)

    return NextResponse.json({
      score_id: scoreRecord.id,
      score: totalScore,
      total: totalQuestions,
      pourcentage: Math.round(pourcentage * 10) / 10,
      parties: partiesList.length > 0 ? partiesList : undefined,
      corrections,
      streak: newStreak,
    })
  } catch (error) {
    console.error('Erreur API submit_quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur lors de la correction' }, { status: 500 })
  }
}
