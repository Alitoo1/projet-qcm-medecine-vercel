'use client'

import { useState, useMemo, useRef } from 'react'

interface Proposition {
  i: number
  t: string
  c: boolean
}

export interface QuestionItem {
  id: number
  type: string
  enonce: string
  propositions: Proposition[]
  explication: string | null
  images?: string[] | null
  coursId: number | null
  cours?: {
    id: number
    titre: string
    sousModuleId?: number
    sousModule?: {
      id: number
      nom: string
      moduleId?: number
      module?: {
        id: number
        nom: string
        semestreId?: number
        semestre?: {
          id: number
          nom: string
        }
      }
    }
  } | null
}

export interface SemestreHierarchy {
  id: number
  nom: string
  modules: {
    id: number
    nom: string
    sousModules: {
      id: number
      nom: string
      cours: {
        id: number
        titre: string
        count: number
      }[]
    }[]
  }[]
}

export function QuestionsManagerClient({
  initialQuestions,
  hierarchy,
}: {
  initialQuestions: QuestionItem[]
  hierarchy: SemestreHierarchy[]
}) {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions)

  // Filtres hiérarchiques
  const [selectedSemestreId, setSelectedSemestreId] = useState<number | 'all'>('all')
  const [selectedModuleId, setSelectedModuleId] = useState<number | 'all'>('all')
  const [selectedSousModuleId, setSelectedSousModuleId] = useState<number | 'all'>('all')
  const [selectedCoursId, setSelectedCoursId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // État édition
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{
    enonce: string
    propositions: Proposition[]
    explication: string
    images: string[]
  } | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modules disponibles selon le semestre sélectionné
  const availableModules = useMemo(() => {
    if (selectedSemestreId === 'all') {
      return hierarchy.flatMap((s) => s.modules)
    }
    const sem = hierarchy.find((s) => s.id === selectedSemestreId)
    return sem ? sem.modules : []
  }, [hierarchy, selectedSemestreId])

  // Sous-modules disponibles selon le module sélectionné
  const availableSousModules = useMemo(() => {
    if (selectedModuleId === 'all') {
      return availableModules.flatMap((m) => m.sousModules)
    }
    const mod = availableModules.find((m) => m.id === selectedModuleId)
    return mod ? mod.sousModules : []
  }, [availableModules, selectedModuleId])

  // Cours disponibles selon le sous-module sélectionné
  const availableCours = useMemo(() => {
    if (selectedSousModuleId === 'all') {
      return availableSousModules.flatMap((sm) => sm.cours)
    }
    const sm = availableSousModules.find((s) => s.id === selectedSousModuleId)
    return sm ? sm.cours : []
  }, [availableSousModules, selectedSousModuleId])

  // Handlers avec cascade
  const handleSemestreChange = (semId: number | 'all') => {
    setSelectedSemestreId(semId)
    setSelectedModuleId('all')
    setSelectedSousModuleId('all')
    setSelectedCoursId('all')
  }

  const handleModuleChange = (modId: number | 'all') => {
    setSelectedModuleId(modId)
    setSelectedSousModuleId('all')
    setSelectedCoursId('all')
  }

  const handleSousModuleChange = (smId: number | 'all') => {
    setSelectedSousModuleId(smId)
    setSelectedCoursId('all')
  }

  const handleResetFilters = () => {
    setSelectedSemestreId('all')
    setSelectedModuleId('all')
    setSelectedSousModuleId('all')
    setSelectedCoursId('all')
    setSearchQuery('')
  }

  // Filtrage des questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const coursObj = q.cours
      const sousModObj = coursObj?.sousModule
      const modObj = sousModObj?.module
      const semObj = modObj?.semestre

      if (selectedSemestreId !== 'all' && semObj?.id !== selectedSemestreId) return false
      if (selectedModuleId !== 'all' && modObj?.id !== selectedModuleId) return false
      if (selectedSousModuleId !== 'all' && sousModObj?.id !== selectedSousModuleId) return false
      if (selectedCoursId !== 'all' && coursObj?.id !== selectedCoursId) return false

      if (searchQuery.trim()) {
        const qText = searchQuery.toLowerCase().trim()
        const matchEnonce = q.enonce.toLowerCase().includes(qText)
        const matchCours = coursObj?.titre.toLowerCase().includes(qText)
        if (!matchEnonce && !matchCours) return false
      }

      return true
    }).sort((a, b) => {
      // 1. D'abord par cours si sélection globale
      if (a.coursId !== b.coursId) {
        return (a.coursId || 0) - (b.coursId || 0)
      }

      // 2. Extraire le numéro de question (ex: "1-", "12-", "QR 1 :")
      const matchNumA = a.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
      const numA = matchNumA ? parseInt(matchNumA[1] || matchNumA[2], 10) : 99999

      const matchNumB = b.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
      const numB = matchNumB ? parseInt(matchNumB[1] || matchNumB[2], 10) : 99999

      if (numA !== numB) return numA - numB

      // 3. Extraire le numéro de bloc (ex: "(bloc 1/3)" -> 1)
      const matchBlockA = a.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
      const blockA = matchBlockA ? parseInt(matchBlockA[1], 10) : 0

      const matchBlockB = b.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
      const blockB = matchBlockB ? parseInt(matchBlockB[1], 10) : 0

      if (blockA !== blockB) return blockA - blockB

      return a.id - b.id
    })
  }, [questions, selectedSemestreId, selectedModuleId, selectedSousModuleId, selectedCoursId, searchQuery])

  const startEditing = (q: QuestionItem) => {
    setEditingId(q.id)
    setEditData({
      enonce: q.enonce,
      propositions: Array.isArray(q.propositions)
        ? q.propositions.map((p, idx) => ({ i: idx, t: p.t, c: !!p.c }))
        : [],
      explication: q.explication || '',
      images: Array.isArray(q.images) ? [...q.images] : [],
    })
    setNewImageUrl('')
    setSaveSuccess(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData(null)
    setNewImageUrl('')
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

  const handleAddImageUrl = () => {
    if (!editData || !newImageUrl.trim()) return
    setEditData({
      ...editData,
      images: [...editData.images, newImageUrl.trim()],
    })
    setNewImageUrl('')
  }

  const handleRemoveImage = (indexToRemove: number) => {
    if (!editData) return
    setEditData({
      ...editData,
      images: editData.images.filter((_, idx) => idx !== indexToRemove),
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editData) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          setEditData({
            ...editData,
            images: [...editData.images, data.url],
          })
        }
      } else {
        alert("Erreur lors du téléversement de l'image.")
      }
    } catch {
      alert("Erreur réseau lors de l'envoi de l'image.")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
          images: editData.images,
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
                  images: editData.images,
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

  const hasActiveFilters =
    selectedSemestreId !== 'all' ||
    selectedModuleId !== 'all' ||
    selectedSousModuleId !== 'all' ||
    selectedCoursId !== 'all' ||
    searchQuery.trim() !== ''

  return (
    <div className="space-y-6">
      {/* Panneau de Filtrage Hiérarchique Moderne */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 text-sm">🎯</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Filtre Hiérarchique de l&apos;Arborescence
              </h2>
              <p className="text-[11px] text-slate-500">
                Sélectionnez pas à pas le Semestre, Module, Sous-Module puis Cours
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 hover:underline cursor-pointer self-start sm:self-auto"
            >
              <span>↺</span>
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        {/* Grille des 4 sélecteurs en cascade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Semestre */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              1. Semestre
            </label>
            <select
              value={selectedSemestreId}
              onChange={(e) =>
                handleSemestreChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">Tous les semestres</option>
              {hierarchy.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Module */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              2. Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) =>
                handleModuleChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">Tous les modules ({availableModules.length})</option>
              {availableModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sous-Module */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              3. Sous-Module / Spécialité
            </label>
            <select
              value={selectedSousModuleId}
              onChange={(e) =>
                handleSousModuleChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">Tous les sous-modules ({availableSousModules.length})</option>
              {availableSousModules.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.nom}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Cours */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              4. Cours / Chapitre
            </label>
            <select
              value={selectedCoursId}
              onChange={(e) =>
                setSelectedCoursId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">Tous les cours ({availableCours.length})</option>
              {availableCours.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre} ({c.count} Q)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barre de Recherche Texte Complémentaire */}
        <div className="pt-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche par mot-clé (ex: macule, érythème, mélanonychie, bulle...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <span>✅</span>
            <span>La question et ses images ont été enregistrées avec succès !</span>
          </div>
        )}
      </div>

      {/* Résumé des filtres et compteur */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
        <span>
          Affichage de <strong className="text-teal-600 dark:text-teal-400">{filteredQuestions.length}</strong> question(s)
          {hasActiveFilters && ' selon vos critères'}
        </span>
        <span>Cliquez sur « Modifier » pour cocher les bonnes réponses ou ajouter des images</span>
      </div>

      {/* Liste des questions */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Aucune question ne correspond à cette sélection.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Afficher toutes les questions
            </button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isEditing = editingId === q.id
            const correctPropsCount = Array.isArray(q.propositions)
              ? q.propositions.filter((p) => p.c).length
              : 0

            const hasImages = Array.isArray(q.images) && q.images.length > 0
            const sousModNom = q.cours?.sousModule?.nom
            const modNom = q.cours?.sousModule?.module?.nom
            const semNom = q.cours?.sousModule?.module?.semestre?.nom

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isEditing
                    ? 'bg-teal-50/20 dark:bg-teal-950/20 border-teal-500 ring-1 ring-teal-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* En-tête avec fil d'ariane complet */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {semNom && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/50">
                          {semNom}
                        </span>
                      )}
                      {modNom && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/50">
                          {modNom}
                        </span>
                      )}
                      {sousModNom && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {sousModNom}
                        </span>
                      )}
                      {q.cours?.titre && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/60">
                          📄 {q.cours.titre}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {q.type}
                      </span>
                      {hasImages && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200/50 flex items-center gap-1">
                          <span>🖼️</span> {q.images!.length} image(s)
                        </span>
                      )}
                      {correctPropsCount === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/50">
                          ⚠️ 0 réponse cochée
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200/50">
                          ✅ {correctPropsCount} réponse(s) cochée(s)
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

                    {/* Images attachées si existantes */}
                    {hasImages && (
                      <div className="flex flex-wrap gap-3 py-2">
                        {q.images!.map((imgUrl, iIdx) => (
                          <a
                            key={iIdx}
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[200px] max-h-[160px] group shadow-xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt="Illustration question"
                              className="object-cover w-full h-full group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                              🔍 Agrandir
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

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

                    {/* Section Images / Illustrations */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>🖼️</span>
                          <span>Images et schémas associés ({editData.images.length})</span>
                        </label>
                      </div>

                      {/* Galerie des images attachées */}
                      {editData.images.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {editData.images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 w-28 h-24 bg-white dark:bg-slate-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt="Miniature"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition"
                                title="Supprimer l'image"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contrôles pour ajouter une image */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Option A : Téléversement Fichier */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            📤 Téléverser depuis l&apos;ordinateur :
                          </span>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                          />
                          {uploadingImage && (
                            <p className="text-[10px] text-teal-600 font-bold animate-pulse">
                              Téléversement en cours...
                            </p>
                          )}
                        </div>

                        {/* Option B : Par URL externe */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            🔗 Ou coller un lien URL d&apos;image :
                          </span>
                          <div className="flex gap-1.5">
                            <input
                              type="url"
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              placeholder="https://exemple.com/image.jpg"
                              className="flex-1 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddImageUrl}
                              disabled={!newImageUrl.trim()}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
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
                        disabled={saving || uploadingImage}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        {saving ? 'Enregistrement...' : '💾 Sauvegarder la question'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
