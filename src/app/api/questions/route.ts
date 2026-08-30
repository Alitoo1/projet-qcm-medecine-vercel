import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { semestreIdForCours, userHasSemestreAccess } from '@/lib/premium'
import type { Proposition, QuestionQcmClient, QuestionRedactionClient, PropositionAvecReponse } from '@/types'

export async function GET(req: Request) {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const { searchParams } = new URL(req.url)
    const coursParam = searchParams.get('cours')
    const idsParam = searchParams.get('ids')
    const revisionParam = searchParams.get('revision')
    const typeParam = searchParams.get('type') || 'all'
    const shuffleProps = searchParams.get('shuffle_props') === '1'

    let coursId: number | null = null
    let questionIds: number[] = []

    if (revisionParam) {
      const revScoreId = parseInt(revisionParam, 10)
      if (isNaN(revScoreId)) {
        return NextResponse.json({ error: 'ID de révision invalide' }, { status: 400 })
      }
      const score = await prisma.score.findFirst({
        where: { id: revScoreId, userId: user.id },
      })
      if (!score || !score.erreursIds) {
        return NextResponse.json({ error: 'Score de révision introuvable' }, { status: 404 })
      }
      try {
        questionIds = JSON.parse(score.erreursIds) as number[]
      } catch {
        questionIds = []
      }
    } else if (idsParam) {
      questionIds = idsParam
        .split(',')
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => !isNaN(n))
    } else if (coursParam) {
      coursId = parseInt(coursParam, 10)
      if (isNaN(coursId)) {
        return NextResponse.json({ error: 'ID de cours invalide' }, { status: 400 })
      }

      // Vérifier accès premium
      const semId = await semestreIdForCours(coursId)
      if (semId) {
        const hasAccess = await userHasSemestreAccess(user.id, semId, user.role === 'admin')
        if (!hasAccess) {
          return NextResponse.json({ error: 'Accès réservé aux membres premium' }, { status: 403 })
        }
      }
    } else {
      return NextResponse.json({ error: 'Paramètre cours, revision ou ids requis' }, { status: 400 })
    }

    // Récupérer les favoris et notes de l'utilisateur
    const [userFavoris, userNotes] = await Promise.all([
      prisma.favori.findMany({ where: { userId: user.id } }),
      prisma.noteQuestion.findMany({ where: { userId: user.id } }),
    ])

    const favorisMap = new Set(userFavoris.map((f) => `${f.questionType}:${f.questionId}`))
    const notesMap = new Map(userNotes.map((n) => [`${n.questionType}:${n.questionId}`, n.contenu]))

    // Charger les QCM
    let qcmList: QuestionQcmClient[] = []
    if (typeParam === 'all' || typeParam === 'qcm') {
      const rawQcm = await prisma.questionQcm.findMany({
        where: idsParam || revisionParam
          ? { id: { in: questionIds } }
          : { coursId: coursId! },
        include: {
          cours: {
            select: {
              sousModule: {
                select: {
                  module: {
                    select: { semestreId: true },
                  },
                },
              },
            },
          },
          partie: {
            select: {
              examen: {
                select: {
                  module: {
                    select: { semestreId: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      })

      // Filtrer les questions selon l'accès premium de leur semestre
      const accessibleQcm = []
      for (const q of rawQcm) {
        const semId =
          q.cours?.sousModule?.module?.semestreId ??
          q.partie?.examen?.module?.semestreId ??
          null

        if (semId) {
          const hasAccess = await userHasSemestreAccess(user.id, semId, user.role === 'admin')
          if (!hasAccess) continue // Ignorer les questions des semestres verrouillés
        }

        accessibleQcm.push(q)
      }

      // Trier par ordre naturel du document si les IDs ne sont pas spécifiés
      if (!idsParam) {
        accessibleQcm.sort((a, b) => {
          const matchNumA = a.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
          const numA = matchNumA ? parseInt(matchNumA[1] || matchNumA[2], 10) : 99999

          const matchNumB = b.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
          const numB = matchNumB ? parseInt(matchNumB[1] || matchNumB[2], 10) : 99999

          if (numA !== numB) return numA - numB

          const matchBlockA = a.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
          const blockA = matchBlockA ? parseInt(matchBlockA[1], 10) : 0

          const matchBlockB = b.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
          const blockB = matchBlockB ? parseInt(matchBlockB[1], 10) : 0

          if (blockA !== blockB) return blockA - blockB

          return a.id - b.id
        })
      }

      qcmList = accessibleQcm.map((q) => {
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
          favori: favorisMap.has(`qcm:${q.id}`),
          note: notesMap.get(`qcm:${q.id}`) || '',
        }
      })
    }

    // Charger les questions rédactionnelles
    let redactionList: QuestionRedactionClient[] = []
    if ((typeParam === 'all' || typeParam === 'redaction') && !idsParam) {
      const rawRedaction = await prisma.questionRedactionnelle.findMany({
        where: { coursId: coursId! },
        orderBy: { id: 'asc' },
      })

      redactionList = rawRedaction.map((r) => ({
        id: r.id,
        enonce: r.enonce,
        images: (r.images as string[]) || [],
        favori: favorisMap.has(`redaction:${r.id}`),
        note: notesMap.get(`redaction:${r.id}`) || '',
      }))
    }

    return NextResponse.json({
      cours_id: coursId,
      qcm: qcmList,
      redaction: redactionList,
    })
  } catch (error) {
    console.error('Erreur API questions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
