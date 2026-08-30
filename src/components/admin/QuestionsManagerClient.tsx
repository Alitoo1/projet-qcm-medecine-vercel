'use client'

import { useState, useMemo } from 'react'

interface Proposition {
  i: number
  t: string
  c: boolean
}

interface QuestionItem {
  id: number
  type: string
  enonce: string
  propositions: Proposition[]
  explication: string | null
  coursId: number | null
  cours?: {
    id: number
    titre: string
    sousModule?: {
      nom: string
      module?: {
        nom: string
      }
    }
  } | null
}

interface CoursFilter {
  id: number
  titre: string
  moduleNom?: string
  count: number
}

export function QuestionsManagerClient({
  initialQuestions,
  coursList,
}: {
  initialQuestions: QuestionItem[]
  coursList: CoursFilter[]
}) {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions)
  const [selectedCoursId, setSelectedCoursId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{
    enonce: string
    propositions: Proposition[]
    explication: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null)

  // Filtrer les questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchCours = selectedCoursId === 'all' || q.coursId === selectedCoursId
      const qText = searchQuery.toLowerCase().trim()
      const matchSearch =
        !qText ||
        q.enonce.toLowerCase().includes(qText) ||
        (q.cours?.titre && q.cours.titre.toLowerCase().includes(qText))
      return matchCours && matchSearch
    })
  }, [questions, selectedCoursId, searchQuery])

  const startEditing = (q: QuestionItem) => {
    setEditingId(q.id)
    setEditData({
      enonce: q.enonce,
      propositions: Array.isArray(q.propositions)
        ? q.propositions.map((p, idx) => ({ i: idx, t: p.t, c: !!p.c }))
        : [],
      explication: q.explication || '',
    })
    setSaveSuccess(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData(null)
  }

  const togglePropositionCorrect = (propIndex: number) => {
    if (!editData) return
    const updated = editData.propositions.map((p, idx) =>
      idx === propIndex ? { ...p, c: !p.c } : p
    )
    setEditData({ ...editData, propositions: updated })
  }

  const updatePropositionText = (propIndex: number, newText: string) => {
    if (!editData) return
    const updated = editData.propositions.map((p, idx) =>
      idx === propIndex ? { ...p, t: newText } : p
    )
    setEditData({ ...editData, propositions: updated })
  }

  const handleSave = async (id: number) => {
    if (!editData) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/questions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          questionType: 'qcm',
          enonce: editData.enonce,
          propositions: editData.propositions,
          explication: editData.explication,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  enonce: editData.enonce,
                  propositions: editData.propositions,
                  explication: editData.explication,
                  type: result.question.type,
                }
              : item
          )
        )
        setSaveSuccess(id)
        setEditingId(null)
        setEditData(null)
        setTimeout(() => setSaveSuccess(null), 4000)
      } else {
        alert('Erreur lors de la sauvegarde.')
      }
    } catch {
      alert('Erreur réseau lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre de Filtres & Recherche */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Sélection du cours */}
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filtrer par Chapitre / Cours
            </label>
            <select
              value={selectedCoursId}
              onChange={(e) =>
                setSelectedCoursId(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                )
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="all">Tous les cours ({questions.length} questions)</option>
              {coursList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.moduleNom ? `[${c.moduleNom}] ` : ''}
                  {c.titre} ({c.count} Q)
                </option>
              ))}
            </select>
          </div>

          {/* Recherche */}
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Recherche dans les énoncés
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: macule, érythème, mélanonychie..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <span>✅</span>
            <span>La question a été enregistrée avec succès ! Les bonnes réponses et justifications sont à jour.</span>
          </div>
        )}
      </div>

      {/* Liste des questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>{filteredQuestions.length} question(s) affichée(s)</span>
          <span>Cliquez sur « Modifier » pour cocher les bonnes réponses</span>
        </div>

        {filteredQuestions.map((q) => {
          const isEditing = editingId === q.id
          const correctPropsCount = Array.isArray(q.propositions)
            ? q.propositions.filter((p) => p.c).length
            : 0

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition shadow-xs ${
                isEditing
                  ? 'bg-teal-50/20 dark:bg-teal-950/20 border-teal-500 ring-1 ring-teal-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* En-tête de la question */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/60 dark:border-teal-900/60">
                      {q.cours?.titre || 'Général'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {q.type}
                    </span>
                    {correctPropsCount === 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/50">
                        ⚠️ 0 bonne réponse cochée
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200/50">
                        ✅ {correctPropsCount} bonne(s) réponse(s)
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => startEditing(q)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                  >
                    <span>✏️</span>
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {/* Mode Affichage Normal */}
              {!isEditing && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    {q.enonce}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {Array.isArray(q.propositions) &&
                      q.propositions.map((p, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                            p.c
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              p.c
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {p.c ? '✓' : String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug">{p.t}</span>
                        </div>
                      ))}
                  </div>

                  {q.explication && (
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <span>💡</span> Justification médicale :
                      </div>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-normal">
                        {q.explication}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode Édition Interactif */}
              {isEditing && editData && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Énoncé de la question :
                    </label>
                    <textarea
                      rows={2}
                      value={editData.enonce}
                      onChange={(e) =>
                        setEditData({ ...editData, enonce: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Propositions avec coche directe */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Propositions (Cochez les bonnes réponses) :
                    </label>

                    <div className="space-y-2">
                      {editData.propositions.map((p, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                            p.c
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer shrink-0 mt-1 select-none">
                            <input
                              type="checkbox"
                              checked={p.c}
                              onChange={() => togglePropositionCorrect(idx)}
                              className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                p.c
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={p.t}
                            onChange={(e) =>
                              updatePropositionText(idx, e.target.value)
                            }
                            className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Justification Médicale */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      💡 Explication / Justification du corrigé :
                    </label>
                    <textarea
                      rows={3}
                      value={editData.explication}
                      onChange={(e) =>
                        setEditData({ ...editData, explication: e.target.value })
                      }
                      placeholder="Indiquez ici la justification médicale, les pièges à éviter ou les rappels de cours..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Boutons d'action Enregistrer / Annuler */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleSave(q.id)}
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {saving ? 'Enregistrement...' : '💾 Sauvegarder la question'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
