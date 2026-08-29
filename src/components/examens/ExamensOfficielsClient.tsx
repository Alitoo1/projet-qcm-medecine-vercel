'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface ExamenItem {
  id: number
  titre: string
  estPublie: boolean
  hasAccess: boolean
  pastScores: { score: number; total: number }[]
  totalQcm: number
  totalRedaction: number
  module: {
    id: number
    nom: string
    semestreId: number
    semestre: {
      id: number
      nom: string
      ordre: number
    }
  }
  parties: {
    id: number
    nom: string
    ordre: number
    _count: {
      questionsQcm: number
      questionsRedaction: number
    }
  }[]
}

export function ExamensOfficielsClient({ examens }: { examens: ExamenItem[] }) {
  const [selectedSemestre, setSelectedSemestre] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Extraire la liste unique des semestres
  const semestres = useMemo(() => {
    const map = new Map<number, { id: number; nom: string; ordre: number; count: number }>()
    examens.forEach((e) => {
      const s = e.module.semestre
      if (!map.has(s.id)) {
        map.set(s.id, { id: s.id, nom: s.nom, ordre: s.ordre, count: 0 })
      }
      map.get(s.id)!.count += 1
    })
    return Array.from(map.values()).sort((a, b) => a.ordre - b.ordre)
  }, [examens])

  // Filtrer les examens
  const filteredExamens = useMemo(() => {
    return examens.filter((e) => {
      const matchSemestre = selectedSemestre === 'all' || e.module.semestreId === selectedSemestre
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        e.titre.toLowerCase().includes(q) ||
        e.module.nom.toLowerCase().includes(q) ||
        e.module.semestre.nom.toLowerCase().includes(q)
      return matchSemestre && matchSearch
    })
  }, [examens, selectedSemestre, searchQuery])

  // Grouper les examens par Semestre puis par Module
  const groupedBySemestre = useMemo(() => {
    const groups: {
      semestre: { id: number; nom: string }
      modules: {
        module: { id: number; nom: string }
        examens: ExamenItem[]
      }[]
    }[] = []

    filteredExamens.forEach((exam) => {
      let semGroup = groups.find((g) => g.semestre.id === exam.module.semestre.id)
      if (!semGroup) {
        semGroup = {
          semestre: { id: exam.module.semestre.id, nom: exam.module.semestre.nom },
          modules: [],
        }
        groups.push(semGroup)
      }

      let modGroup = semGroup.modules.find((m) => m.module.id === exam.module.id)
      if (!modGroup) {
        modGroup = {
          module: { id: exam.module.id, nom: exam.module.nom },
          examens: [],
        }
        semGroup.modules.push(modGroup)
      }

      modGroup.examens.push(exam)
    })

    return groups
  }, [filteredExamens])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barre de contrôle : Recherche & Filtres */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm space-y-4">
        {/* Champ de recherche instantané */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une annale, un sujet, un module (ex: Anatomie, Cardiologie 2023...)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtres par Semestre */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedSemestre('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedSemestre === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tous ({examens.length})
          </button>
          {semestres.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSemestre(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedSemestre === s.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.nom} ({s.count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste organisée par Semestre & Module */}
      {groupedBySemestre.length === 0 ? (
        <div className="p-12 text-center bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="font-bold">Aucune annale ne correspond à vos critères.</p>
          <p className="text-xs text-slate-400">Essayez de modifier votre recherche ou sélectionnez un autre semestre.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedBySemestre.map((semGroup) => (
            <div key={semGroup.semestre.id} className="space-y-5">
              {/* En-tête de Semestre */}
              <div className="flex items-center gap-3 border-b border-teal-500/20 dark:border-teal-500/10 pb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {semGroup.semestre.nom.substring(0, 3)}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {semGroup.semestre.nom}
                </h2>
              </div>

              {/* Modules du semestre */}
              <div className="space-y-6 pl-2 sm:pl-4">
                {semGroup.modules.map((modGroup) => (
                  <div key={modGroup.module.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>📂</span>
                      <span>{modGroup.module.nom}</span>
                      <span className="text-[11px] font-normal text-slate-400">({modGroup.examens.length} épreuve{modGroup.examens.length > 1 ? 's' : ''})</span>
                    </div>

                    {/* Grille des examens officiels du module */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modGroup.examens.map((exam) => {
                        const { hasAccess, pastScores, totalQcm, totalRedaction } = exam

                        return (
                          <div
                            key={exam.id}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm hover:border-teal-500/60 dark:hover:border-teal-500/60 transition flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold border border-teal-200/60 dark:border-teal-900/60">
                                  Épreuve officielle
                                </span>

                                {!exam.estPublie && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                    Brouillon
                                  </span>
                                )}
                                {!hasAccess && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                    🔒 Premium
                                  </span>
                                )}
                              </div>

                              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                {exam.titre}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                                  📁 {exam.parties.length} partie(s)
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                                  📝 {totalQcm} QCM
                                </span>
                                {totalRedaction > 0 && (
                                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                                    ✍️ {totalRedaction} Rédaction
                                  </span>
                                )}
                              </div>

                              {/* Historique des tentatives */}
                              {pastScores.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                                    <span>📊</span> Derniers scores obtenus :
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {pastScores.slice().reverse().map((s, i) => {
                                      const pct = Math.round((s.score / (s.total || 1)) * 100)
                                      const isPassed = pct >= 50
                                      return (
                                        <span key={i} className="inline-flex items-center gap-1">
                                          {i > 0 && <span className="text-slate-300 dark:text-slate-600">➔</span>}
                                          <span
                                            className={`px-2 py-0.5 rounded-md border ${
                                              isPassed
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                                                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-300'
                                            }`}
                                          >
                                            {s.score}/{s.total} ({pct}%)
                                          </span>
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-2">
                              {hasAccess ? (
                                <Link
                                  href={`/quiz?officiel=${exam.id}`}
                                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-teal-500/10"
                                >
                                  <span>Lancer l&apos;examen</span>
                                  <span>➔</span>
                                </Link>
                              ) : (
                                <div className="text-center text-xs text-amber-600 dark:text-amber-400 font-semibold py-2">
                                  Accès réservé aux membres premium
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
