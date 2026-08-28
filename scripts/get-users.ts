import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      annee: true,
      emailVerifiedAt: true,
      currentStreak: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
  })

  console.log('=== USERS IN DATABASE ===')
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
