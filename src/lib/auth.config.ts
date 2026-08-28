import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/connexion',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = [
        '/tableau-de-bord',
        '/quiz',
        '/historique',
        '/favoris',
        '/copie',
        '/revision',
        '/examen-blanc',
        '/examens-officiels',
        '/mon-compte',
        '/suggestion',
        '/admin',
      ].some((route) => nextUrl.pathname.startsWith(route))

      if (isProtected) {
        if (isLoggedIn) {
          if (nextUrl.pathname.startsWith('/admin') && auth.user.role !== 'admin') {
            return Response.redirect(new URL('/tableau-de-bord', nextUrl))
          }
          return true
        }
        return false // Redirige automatiquement vers signIn
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id?: string; role?: string; nom?: string; prenom?: string; annee?: string | null }
        token.id = u.id
        token.role = u.role
        token.nom = u.nom
        token.prenom = u.prenom
        token.annee = u.annee
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.nom = token.nom as string
        session.user.prenom = token.prenom as string
        session.user.annee = token.annee as string | null
      }
      return session
    },
  },
  providers: [], // Les providers réels sont dans auth.ts pour Node runtime
} satisfies NextAuthConfig
