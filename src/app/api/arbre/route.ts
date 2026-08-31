import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRequireAuth } from '@/lib/auth-utils'
import { userHasSemestreAccess } from '@/lib/premium'
import type { TreeSemestre } from '@/types'

export async function GET() {
  try {
    const authResult = await apiRequireAuth()
    if ('errorResponse' in authResult) return authResult.errorResponse
    const { user } = authResult

    const semestres = await prisma.semestre.findMany({
      orderBy: { ordre: 'asc' },
      include: {
        modules: {
          orderBy: { ordre: 'asc' },
          include: {
            sousModules: {
              orderBy: { ordre: 'asc' },
              include: {
                cours: {
                  where: user.role === 'admin' ? {} : { estPublie: true },
                  orderBy: { ordre: 'asc' },
                  include: {
                    _count: {
                      select: {
                        questionsQcm: true,
                        questionsRedaction: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const result: TreeSemestre[] = await Promise.all(
      semestres.map(async (s) => {
        const hasAccess = await userHasSemestreAccess(user.id, s.id, user.role === 'admin')

        return {
          id: s.id,
          nom: s.nom,
          locked: !hasAccess,
          modules: s.modules.map((m) => ({
            id: m.id,
            nom: m.nom,
            sousModules: m.sousModules.map((sm) => ({
              id: sm.id,
              nom: sm.nom,
              cours: sm.cours.map((c) => ({
                id: c.id,
                titre: c.titre,
                description: c.description,
                nbQuestions: c._count.questionsQcm + c._count.questionsRedaction,
                nbQcm: c._count.questionsQcm,
                nbRedaction: c._count.questionsRedaction,
                masque: !c.estPublie,
              })),
            })),
          })),
        }
      })
    )

    return NextResponse.json({ semestres: result })
  } catch (error) {
    console.error('Erreur API arbre:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
