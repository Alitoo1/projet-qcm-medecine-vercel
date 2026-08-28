import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifierEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Jeton manquant</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Veuillez utiliser le lien envoyé dans votre boîte email pour valider votre compte.
          </p>
          <Link href="/connexion" className="inline-block text-teal-600 font-semibold text-sm">
            ← Retour à la page de connexion
          </Link>
        </div>
      </div>
    )
  }

  const tokenHash = hashToken(token)

  const verification = await prisma.emailVerification.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })

  if (!verification) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-4xl">❌</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lien invalide ou expiré</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ce lien de confirmation a expiré ou a déjà été utilisé.
          </p>
          <Link href="/connexion" className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Activer le compte
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.deleteMany({
      where: { userId: verification.userId },
    }),
  ])

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl mx-auto">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compte activé avec succès !</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Bienvenue <strong>{verification.user.prenom}</strong>. Votre adresse email a été confirmée.
        </p>
        <div className="pt-2">
          <Link
            href="/connexion?verified=1"
            className="inline-block px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition"
          >
            Se connecter à mon compte →
          </Link>
        </div>
      </div>
    </div>
  )
}
