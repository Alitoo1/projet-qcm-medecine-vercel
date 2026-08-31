// ── Enums (miroir des enums Prisma) ────────────────────────────────

export type Role = 'etudiant' | 'admin'
export type TypeQuestion = 'QCU' | 'QCM'
export type ModeScore = 'entrainement' | 'examen' | 'revision'
export type MotifSignalement = 'reponse_fausse' | 'enonce_ambigu' | 'faute_frappe' | 'autre'
export type StatutSignalement = 'nouveau' | 'traite' | 'ignore'
export type StatutSuggestion = 'nouveau' | 'lu'
export type TypeQuestionRef = 'qcm' | 'redaction'

// ── Session utilisateur ────────────────────────────────────────────

export interface UserSession {
  id: number
  nom: string
  prenom: string
  email: string
  role: Role
  annee: number | null
}

// ── Arbre hiérarchique ─────────────────────────────────────────────

export interface TreeCours {
  id: number
  titre: string
  description: string | null
  nbQuestions: number
  nbQcm: number
  nbRedaction: number
  masque: boolean
}

export interface TreeSousModule {
  id: number
  nom: string
  cours: TreeCours[]
}

export interface TreeModule {
  id: number
  nom: string
  sousModules: TreeSousModule[]
}

export interface TreeSemestre {
  id: number
  nom: string
  locked: boolean
  modules: TreeModule[]
}

// ── Questions (côté client, SANS les réponses) ─────────────────────

export interface Proposition {
  i: number  // index original
  t: string  // texte
}

/** Proposition avec la réponse correcte (serveur uniquement) */
export interface PropositionAvecReponse extends Proposition {
  c: boolean
}

export interface QuestionQcmClient {
  id: number
  type: TypeQuestion
  enonce: string
  propositions: Proposition[]
  images: string[]
  favori?: boolean
  note?: string
}

export interface QuestionRedactionClient {
  id: number
  enonce: string
  images: string[]
  favori?: boolean
  note?: string
}

// ── Quiz ───────────────────────────────────────────────────────────

export interface QuizSubmission {
  reponses: Record<string, number[]>
  duree?: number
  // Contexte : un seul des suivants
  coursId?: number
  mode?: ModeScore
  examModuleId?: number
  officielExamenId?: number
  revisionScoreId?: number
  examToken?: string
}

export interface QuizCorrection {
  questionId: number
  correct: boolean
  bonnesReponses: number[]
  reponsesDonnees: number[]
  explication: string | null
}

export interface PartieScore {
  nom: string
  score: number
  total: number
}

export interface QuizResult {
  scoreId: number
  score: number
  total: number
  pourcentage: number
  parties?: PartieScore[]
  corrections: QuizCorrection[]
  streak: number
}

// ── Examen officiel ────────────────────────────────────────────────

export interface ExamItem {
  kind: 'qcm' | 'redaction'
  partie: string
  partieIndex: number
  partieCount: number
  data: QuestionQcmClient | QuestionRedactionClient
}

// ── Historique ──────────────────────────────────────────────────────

export interface ScoreRecord {
  id: number
  coursId: number | null
  coursNom: string | null
  moduleId: number | null
  moduleNom: string | null
  examenOfficielId: number | null
  examenNom: string | null
  score: number
  total: number
  pourcentage: number
  dureeSecondes: number | null
  mode: ModeScore
  erreursCount: number
  partiesScores: PartieScore[] | null
  hasReponsesData: boolean
  createdAt: string
}

// ── Payloads API ───────────────────────────────────────────────────

export interface FavoritePayload {
  questionType: TypeQuestionRef
  questionId: number
}

export interface NotePayload {
  questionType: TypeQuestionRef
  questionId: number
  contenu: string
}

export interface ReportPayload {
  questionType: TypeQuestionRef
  questionId: number
  motif: MotifSignalement
  commentaire?: string
}

// ── Vérification instantanée ───────────────────────────────────────

export interface CheckAnswerResult {
  correct: boolean
  bonnes_reponses: number[]
  explication: string | null
}

export interface CheckRedactionResult {
  reponse_modele: string
  mots_trouves: string[]
  mots_manques: string[]
  couverture: number
}
