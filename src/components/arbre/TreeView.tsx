'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TreeSemestre, TreeCours } from '@/types'

interface TreeViewProps {
  semestres: TreeSemestre[]
}

export function TreeView({ semestres }: TreeViewProps) {
  const [openSemestres, setOpenSemestres] = useState<Record<number, boolean>>({
    [semestres[0]?.id || 1]: true,
  })
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({})
  const [openSousModules, setOpenSousModules] = useState<Record<number, boolean>>({})
  const [selectedCours, setSelectedCours] = useState<TreeCours | null>(null)

  const toggleSemestre = (id: number) => {
    setOpenSemestres((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleModule = (id: number) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSousModule = (id: number) => {
    setOpenSousModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panneau Gauche : Arbre */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📂</span> Catalogue des cours & matières
        </h2>

        <div className="space-y-3">
          {semestres.map((semestre) => {
            const isSemOpen = !!openSemestres[semestre.id]

            return (
              <div
                key={semestre.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
              >
                {/* En-tête Semestre */}
                <button
                  onClick={() => toggleSemestre(semestre.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-white">
                    <span>{isSemOpen ? '▾' : '▸'}</span>
                    <span>{semestre.nom}</span>
                    {semestre.locked && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-normal">
                        🔒 Premium
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {semestre.modules.length} module{semestre.modules.length > 1 ? 's' : ''}
                  </span>
                </button>

                {/* Modules du semestre */}
                {isSemOpen && (
                  <div className="p-3 space-y-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    {semestre.locked ? (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Ce semestre est réservé aux membres premium. Contactez l&apos;administration pour activer votre accès.
                        </p>
                      </div>
                    ) : semestre.modules.length === 0 ? (
                      <div className="text-xs text-slate-400 p-2">Aucun module pour le moment.</div>
                    ) : (
                      semestre.modules.map((module) => {
                        const isModOpen = !!openModules[module.id]

                        return (
                          <div
                            key={module.id}
                            className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="w-full flex items-center justify-between p-3 bg-slate-50/70 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                                <span>{isModOpen ? '▾' : '▸'}</span>
                                <span>{module.nom}</span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {module.sousModules.length} sous-module{module.sousModules.length > 1 ? 's' : ''}
                              </span>
                            </button>

                            {isModOpen && (
                              <div className="p-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                                {module.sousModules.map((sm) => {
                                  const isSmOpen = !!openSousModules[sm.id]

                                  return (
                                    <div key={sm.id} className="pl-2 space-y-1">
                                      <button
                                        onClick={() => toggleSousModule(sm.id)}
                                        className="w-full flex items-center justify-between py-1 px-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span>{isSmOpen ? '▾' : '▸'}</span>
                                          <span>{sm.nom}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                          {sm.cours.length} cours
                                        </span>
                                      </button>

                                      {isSmOpen && (
                                        <div className="pl-4 space-y-1 pt-1">
                                          {sm.cours.map((c) => (
                                            <button
                                              key={c.id}
                                              onClick={() => setSelectedCours(c)}
                                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                                                selectedCours?.id === c.id
                                                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-200 font-semibold border border-teal-300 dark:border-teal-800'
                                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                              }`}
                                            >
                                              <span className="truncate pr-2">
                                                {c.titre} {c.masque && '🚫 (Masqué)'}
                                              </span>
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                                {c.nbQuestions} Q
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Panneau Droit : Détail du cours sélectionné */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit space-y-6 lg:sticky lg:top-20">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Détail du cours
        </h2>

        {selectedCours ? (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {selectedCours.titre}
              </div>
              {selectedCours.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCours.description}
                </p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 border border-teal-200/80 dark:border-teal-900/60 space-y-1 text-center shadow-xs">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
                {selectedCours.nbQuestions}
              </div>
              <div className="text-xs text-teal-900/80 dark:text-teal-300/80 font-semibold">
                Questions disponibles pour ce cours
              </div>
            </div>

            <Link
              href={`/quiz?cours=${selectedCours.id}`}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>Lancer l&apos;entraînement</span>
              <span>🚀</span>
            </Link>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="text-4xl block animate-bounce">👈</span>
            <span className="leading-relaxed block font-medium">Sélectionnez un cours dans l&apos;arborescence pour voir ses détails et démarrer votre session QCM.</span>
          </div>
        )}
      </div>
    </div>
  )
}
