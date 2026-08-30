import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { AdminImportClient } from '@/components/admin/AdminImportClient'

export const dynamic = 'force-dynamic'

export default async function AdminImportPage() {
  await requireAdmin()

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
                orderBy: { ordre: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  const coursesFlat = semestres.flatMap((s) =>
    s.modules.flatMap((m) =>
      m.sousModules.flatMap((sm) =>
        sm.cours.map((c) => ({
          id: c.id,
          titre: c.titre,
          sousModuleNom: sm.nom,
          moduleNom: m.nom,
          semestreNom: s.nom,
        }))
      )
    )
  )

  return <AdminImportClient courses={coursesFlat} />
}
