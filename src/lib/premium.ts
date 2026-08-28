import { prisma } from './prisma'

export async function isSemestrePremium(semestreId: number): Promise<boolean> {
  const s = await prisma.semestre.findUnique({
    where: { id: semestreId },
    select: { estPremium: true },
  })
  return s?.estPremium ?? false
}

export async function userHasSemestreAccess(
  userId: number,
  semestreId: number,
  isAdmin: boolean = false
): Promise<boolean> {
  if (isAdmin) return true

  const isPrem = await isSemestrePremium(semestreId)
  if (!isPrem) return true

  const access = await prisma.accesPremium.findFirst({
    where: {
      userId,
      semestreId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  return !!access
}

export async function semestreIdForCours(coursId: number): Promise<number | null> {
  const c = await prisma.cours.findUnique({
    where: { id: coursId },
    select: {
      sousModule: {
        select: {
          module: {
            select: {
              semestreId: true,
            },
          },
        },
      },
    },
  })
  return c?.sousModule?.module?.semestreId ?? null
}

export async function semestreIdForModule(moduleId: number): Promise<number | null> {
  const m = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { semestreId: true },
  })
  return m?.semestreId ?? null
}
