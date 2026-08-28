import { prisma } from './prisma'

/**
 * Met à jour et calcule la série quotidienne d'entraînement (streak)
 * Retourne la nouvelle valeur du streak courant.
 */
export async function updateUserStreak(userId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastActivityDate: true,
      currentStreak: true,
      longestStreak: true,
    },
  })

  if (!user) return 0

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const lastStr = user.lastActivityDate ? user.lastActivityDate.toISOString().split('T')[0] : null

  if (lastStr === todayStr) {
    // Déjà actif aujourd'hui
    return user.currentStreak
  }

  let newStreak = 1
  if (lastStr) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastStr === yesterdayStr) {
      newStreak = user.currentStreak + 1
    }
  }

  const newLongest = Math.max(user.longestStreak, newStreak)

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: now,
    },
  })

  return newStreak
}
