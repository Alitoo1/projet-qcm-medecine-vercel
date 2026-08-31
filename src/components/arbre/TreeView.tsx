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
                                              <div className="flex items-center gap-1 shrink-0">
                                                {c.nbQcm > 0 && (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                                                    {c.nbQcm} QCM
                                                  </span>
                                                )}
                                                {c.nbRedaction > 0 && (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                                    {c.nbRedaction} QR
                                                  </span>
                                                )}
                                              </div>
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

            {/* Badges de comptage */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/50 text-center">
                <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                  {selectedCours.nbQcm}
                </div>
                <div className="text-[11px] font-semibold text-teal-800/80 dark:text-teal-300/80 mt-0.5">
                  Questions QCM
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 text-center">
                <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                  {selectedCours.nbRedaction}
                </div>
                <div className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Rédactionnelles (QR)
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2 pt-1">
              {selectedCours.nbQcm > 0 && (
                <Link
                  href={`/quiz?cours=${selectedCours.id}&type=qcm`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>🎯 S&apos;entraîner en QCM ({selectedCours.nbQcm})</span>
                  <span>→</span>
                </Link>
              )}

              {selectedCours.nbRedaction > 0 && (
                <Link
                  href={`/quiz?cours=${selectedCours.id}&type=redaction`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>✍️ Questions Rédactionnelles ({selectedCours.nbRedaction})</span>
                  <span>→</span>
                </Link>
              )}

              {selectedCours.nbQuestions === 0 && (
                <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Aucune question disponible pour le moment.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="text-4xl block animate-bounce">👈</span>
            <span className="leading-relaxed block font-medium">Sélectionnez un cours dans l&apos;arborescence pour voir ses détails et démarrer votre session QCM ou Rédactionnelle.</span>
          </div>
        )}
      </div>
    </div>
  )
}
