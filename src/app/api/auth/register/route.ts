import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { auth } from '@/lib/auth'

const registerSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  annee: z.number().int().min(1).max(6),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user) {
      return NextResponse.json(
        { error: 'Vous êtes déjà connecté avec un compte. Déconnectez-vous pour créer un nouveau compte.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { prenom, nom, email, annee, password } = parsed.data

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà associée à un compte.' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer l'utilisateur avec activation instantanée
    const user = await prisma.user.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'etudiant',
        annee,
        emailVerifiedAt: new Date(),
        currentStreak: 1,
        longestStreak: 1,
      },
    })

    // Envoyer l'email de bienvenue en tâche de fond (non bloquant)
    sendWelcomeEmail(user.email, user.prenom).catch((err) => {
      console.error("Erreur envoi email bienvenue:", err)
    })

    return NextResponse.json({ ok: true, userId: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    console.error('Erreur API inscription:', error)
    return NextResponse.json(
      { error: "Une erreur interne s'est produite lors de l'inscription." },
      { status: 500 }
    )
  }
}
