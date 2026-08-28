import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    nom: string
    prenom: string
    annee?: string | null
  }

  interface Session {
    user: {
      id: string
      role: string
      nom: string
      prenom: string
      annee?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    nom?: string
    prenom?: string
    annee?: string | null
  }
}
