import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { prisma } from './prisma'
import { authConfig } from './auth.config'
import bcrypt from 'bcryptjs'

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MIN = 15

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const ip = (req.headers?.get('x-forwarded-for') ?? '127.0.0.1').slice(0, 45)

        // ── Anti-bruteforce ──
        const windowStart = new Date(Date.now() - LOGIN_WINDOW_MIN * 60 * 1000)

        const [byEmail, byIp] = await Promise.all([
          prisma.loginAttempt.count({
            where: { email, attemptedAt: { gte: windowStart } },
          }),
          prisma.loginAttempt.count({
            where: { ip, attemptedAt: { gte: windowStart } },
          }),
        ])

        if (byEmail >= LOGIN_MAX_ATTEMPTS || byIp >= LOGIN_MAX_ATTEMPTS) {
          throw new Error('Trop de tentatives. Réessayez dans 15 minutes.')
        }

        // ── Recherche utilisateur ──
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          await prisma.loginAttempt.create({ data: { email, ip } })
          // Nettoyage opportuniste > 24 h
          await prisma.loginAttempt.deleteMany({
            where: { attemptedAt: { lt: new Date(Date.now() - 86_400_000) } },
          })
          return null
        }

        // ── Vérification compte suspendu ──
        if (user.estBloque) {
          throw new Error('Votre compte a été suspendu par un administrateur.')
        }

        // ── Succès ──
        await prisma.loginAttempt.deleteMany({ where: { email } })

        // Si pour un ancien compte emailVerifiedAt n'était pas renseigné, le mettre à jour automatiquement
        if (!user.emailVerifiedAt) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() },
          })
        }

        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          annee: user.annee ? String(user.annee) : null,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },
})
