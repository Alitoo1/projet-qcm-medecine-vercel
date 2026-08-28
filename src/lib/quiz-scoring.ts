import type { PropositionAvecReponse, QuizCorrection } from '@/types'

/**
 * Compare les réponses de l'étudiant aux propositions d'une question
 */
export function scoreQuestion(
  propositions: PropositionAvecReponse[],
  reponsesDonnees: number[]
): { correct: boolean; bonnesReponses: number[] } {
  const bonnesReponses: number[] = []

  propositions.forEach((p, idx) => {
    if (p.c) {
      bonnesReponses.push(idx)
    }
  })

  const choisisTries = [...reponsesDonnees].sort((a, b) => a - b)
  const bonnesTries = [...bonnesReponses].sort((a, b) => a - b)

  const correct =
    choisisTries.length === bonnesTries.length &&
    choisisTries.every((val, index) => val === bonnesTries[index])

  return { correct, bonnesReponses }
}

/**
 * Évalue une réponse rédactionnelle par rapport à la réponse modèle et aux mots clés
 */
export function evaluateRedaction(
  reponseEtudiant: string,
  reponseModele: string,
  motsCles: string[]
): { motsTrouves: string[]; motsManques: string[]; couverture: number } {
  const texteNormalise = reponseEtudiant.toLowerCase()
  const motsTrouves: string[] = []
  const motsManques: string[] = []

  for (const mot of motsCles) {
    if (texteNormalise.includes(mot.toLowerCase())) {
      motsTrouves.push(mot)
    } else {
      motsManques.push(mot)
    }
  }

  const couverture = motsCles.length > 0
    ? Math.round((motsTrouves.length / motsCles.length) * 100)
    : 100

  return { motsTrouves, motsManques, couverture }
}
