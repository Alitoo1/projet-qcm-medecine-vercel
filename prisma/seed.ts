import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  const passwordHash = await bcrypt.hash('admin123', 10)
  const studentPassHash = await bcrypt.hash('password123', 10)

  // 1. Création du profil Administrateur principal
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fmp.ma' },
    update: {
      role: 'admin',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@fmp.ma',
      passwordHash,
      role: 'admin',
      annee: 6,
      emailVerifiedAt: new Date(),
      currentStreak: 1,
      longestStreak: 1,
    },
  })

  console.log(`✅ Profil Administrateur configuré : ${admin.email} (rôle: ${admin.role})`)

  // 2. Création d'un profil étudiant de test
  const student = await prisma.user.upsert({
    where: { email: 'etudiant@fmp.ma' },
    update: {
      role: 'etudiant',
      emailVerifiedAt: new Date(),
      passwordHash: studentPassHash,
    },
    create: {
      nom: 'El Amrani',
      prenom: 'Sara',
      email: 'etudiant@fmp.ma',
      passwordHash: studentPassHash,
      role: 'etudiant',
      annee: 2,
      emailVerifiedAt: new Date(),
      currentStreak: 3,
      longestStreak: 5,
    },
  })

  console.log(`✅ Profil Étudiant de test configuré : ${student.email}`)

  // 3. Semestres de base
  const s1 = await prisma.semestre.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Semestre 1', estPremium: false, ordre: 1 },
  })

  const s2 = await prisma.semestre.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nom: 'Semestre 2', estPremium: false, ordre: 2 },
  })

  // 4. Modules
  const m1 = await prisma.module.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, semestreId: s1.id, nom: 'Anatomie I', ordre: 1 },
  })

  const m2 = await prisma.module.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, semestreId: s1.id, nom: 'Physiologie', ordre: 2 },
  })

  // 5. Sous-modules
  const sm1 = await prisma.sousModule.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, moduleId: m1.id, nom: 'Appareil locomoteur', ordre: 1 },
  })

  // 6. Cours
  const c1 = await prisma.cours.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      sousModuleId: sm1.id,
      titre: 'Ostéologie du membre supérieur',
      description: 'Os, articulations et repères anatomiques',
      estPublie: true,
      ordre: 1,
    },
  })

  // 7. Questions QCM de démonstration
  const countQcm = await prisma.questionQcm.count({ where: { coursId: c1.id } })
  if (countQcm === 0) {
    await prisma.questionQcm.createMany({
      data: [
        {
          coursId: c1.id,
          type: 'QCU',
          enonce: 'Quel os forme le squelette du bras ?',
          propositions: [
            { t: 'Humérus', c: true },
            { t: 'Fémur', c: false },
            { t: 'Radius', c: false },
            { t: 'Tibia', c: false },
          ],
          explication: "L'humérus est l'os long unique formant le squelette du bras.",
        },
        {
          coursId: c1.id,
          type: 'QCM',
          enonce: "Parmi ces os, lesquels appartiennent au squelette de l'avant-bras ?",
          propositions: [
            { t: 'Radius', c: true },
            { t: 'Ulna (Cubitus)', c: true },
            { t: 'Humérus', c: false },
            { t: 'Clavicule', c: false },
          ],
          explication: "Le radius et l'ulna forment ensemble l'avant-bras.",
        },
      ],
    })
    console.log('✅ Questions QCM de démo créées.')
  }

  console.log('\n🎉 Seed terminé avec succès !')
  console.log('--------------------------------------------------')
  console.log('Identifiants de connexion Administrateur :')
  console.log('  📧 Email        : admin@fmp.ma')
  console.log('  🔑 Mot de passe : admin123')
  console.log('--------------------------------------------------')
  console.log('Identifiants de connexion Étudiant :')
  console.log('  📧 Email        : etudiant@fmp.ma')
  console.log('  🔑 Mot de passe : password123')
  console.log('--------------------------------------------------\n')
}

main()
  .catch((e) => {
    console.error('Erreur de seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
