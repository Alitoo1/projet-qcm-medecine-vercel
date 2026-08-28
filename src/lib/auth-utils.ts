import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { UserSession } from '@/types'

export async function getSession() {
  return await auth()
}

export async function requireAuth(): Promise<UserSession> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/connexion')
  }
  return {
    id: parseInt(session.user.id, 10),
    email: session.user.email ?? '',
    role: (session.user.role as 'etudiant' | 'admin') ?? 'etudiant',
    nom: session.user.nom ?? '',
    prenom: session.user.prenom ?? '',
    annee: session.user.annee ? parseInt(session.user.annee, 10) : null,
  }
}

export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/tableau-de-bord')
  }
  return user
}

export async function apiRequireAuth(): Promise<{ user: UserSession } | { errorResponse: NextResponse }> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      errorResponse: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }
  return {
    user: {
      id: parseInt(session.user.id, 10),
      email: session.user.email ?? '',
      role: (session.user.role as 'etudiant' | 'admin') ?? 'etudiant',
      nom: session.user.nom ?? '',
      prenom: session.user.prenom ?? '',
      annee: session.user.annee ? parseInt(session.user.annee, 10) : null,
    },
  }
}

export async function apiRequireAdmin(): Promise<{ user: UserSession } | { errorResponse: NextResponse }> {
  const authResult = await apiRequireAuth()
  if ('errorResponse' in authResult) {
    return authResult
  }
  if (authResult.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    }
  }
  return authResult
}
