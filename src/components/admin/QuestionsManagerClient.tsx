'use client'

import { useState, useMemo, useRef } from 'react'

interface Proposition {
  i: number
  t: string
  c: boolean
}

export interface QuestionItem {
  id: number
  questionType: 'qcm' | 'redaction'
  type: string // 'QCU' | 'QCM' | 'Rédactionnelle'
  enonce: string
  propositions?: Proposition[]
  reponseModele?: string | null
  motsCles?: string[] | null
  explication?: string | null
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

  // Filtres
  const [formatFilter, setFormatFilter] = useState<'all' | 'qcm' | 'redaction'>('all')
  const [selectedSemestreId, setSelectedSemestreId] = useState<number | 'all'>('all')
  const [selectedModuleId, setSelectedModuleId] = useState<number | 'all'>('all')
  const [selectedSousModuleId, setSelectedSousModuleId] = useState<number | 'all'>('all')
  const [selectedCoursId, setSelectedCoursId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // État d'édition
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingType, setEditingType] = useState<'qcm' | 'redaction'>('qcm')
  const [editData, setEditData] = useState<{
    enonce: string
    propositions: Proposition[]
    reponseModele: string
    motsClesText: string
    explication: string
    images: string[]
  } | null>(null)

  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modules disponibles
  const availableModules = useMemo(() => {
    if (selectedSemestreId === 'all') return hierarchy.flatMap((s) => s.modules)
    const sem = hierarchy.find((s) => s.id === selectedSemestreId)
    return sem ? sem.modules : []
  }, [hierarchy, selectedSemestreId])

  // Sous-modules disponibles
  const availableSousModules = useMemo(() => {
    if (selectedModuleId === 'all') return availableModules.flatMap((m) => m.sousModules)
    const mod = availableModules.find((m) => m.id === selectedModuleId)
    return mod ? mod.sousModules : []
  }, [availableModules, selectedModuleId])

  // Cours disponibles
  const availableCours = useMemo(() => {
    if (selectedSousModuleId === 'all') return availableSousModules.flatMap((sm) => sm.cours)
    const sm = availableSousModules.find((s) => s.id === selectedSousModuleId)
    return sm ? sm.cours : []
  }, [availableSousModules, selectedSousModuleId])

  // Compteurs globaux
  const qcmCount = useMemo(() => questions.filter((q) => q.questionType === 'qcm').length, [questions])
  const redactionCount = useMemo(() => questions.filter((q) => q.questionType === 'redaction').length, [questions])

  // Handlers en cascade
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
    setFormatFilter('all')
    setSelectedSemestreId('all')
    setSelectedModuleId('all')
    setSelectedSousModuleId('all')
    setSelectedCoursId('all')
    setSearchQuery('')
  }

  // Filtrage et Tri naturel
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (formatFilter !== 'all' && q.questionType !== formatFilter) return false

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
      })
      .sort((a, b) => {
        if (a.coursId !== b.coursId) {
          return (a.coursId || 0) - (b.coursId || 0)
        }

        // QCM avant rédactionnelles ou groupé
        const matchNumA = a.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
        const numA = matchNumA ? parseInt(matchNumA[1] || matchNumA[2], 10) : 99999

        const matchNumB = b.enonce.match(/(?:^|\s)(\d+)[-.\s]|(?:QR\s*(\d+))/i)
        const numB = matchNumB ? parseInt(matchNumB[1] || matchNumB[2], 10) : 99999

        if (numA !== numB) return numA - numB

        const matchBlockA = a.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
        const blockA = matchBlockA ? parseInt(matchBlockA[1], 10) : 0

        const matchBlockB = b.enonce.match(/\(bloc\s*(\d+)\/\d+\)/i)
        const blockB = matchBlockB ? parseInt(matchBlockB[1], 10) : 0

        if (blockA !== blockB) return blockA - blockB

        return a.id - b.id
      })
  }, [questions, formatFilter, selectedSemestreId, selectedModuleId, selectedSousModuleId, selectedCoursId, searchQuery])

  const startEditing = (q: QuestionItem) => {
    setEditingId(q.id)
    setEditingType(q.questionType)
    setEditData({
      enonce: q.enonce,
      propositions: Array.isArray(q.propositions)
        ? q.propositions.map((p, idx) => ({ i: idx, t: p.t, c: !!p.c }))
        : [],
      reponseModele: q.reponseModele || '',
      motsClesText: Array.isArray(q.motsCles) ? q.motsCles.join(', ') : '',
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
      const motsClesArray = editData.motsClesText
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)

      const res = await fetch('/api/admin/questions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          questionType: editingType,
          enonce: editData.enonce,
          propositions: editData.propositions,
          reponseModele: editData.reponseModele,
          motsCles: motsClesArray,
          explication: editData.explication,
          images: editData.images,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setQuestions((prev) =>
          prev.map((item) => {
            if (item.id === id && item.questionType === editingType) {
              return {
                ...item,
                enonce: editData.enonce,
                propositions: editData.propositions,
                reponseModele: editData.reponseModele,
                motsCles: motsClesArray,
                explication: editData.explication,
                images: editData.images,
                type: result.question.type || item.type,
              }
            }
            return item
          })
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
    formatFilter !== 'all' ||
    selectedSemestreId !== 'all' ||
    selectedModuleId !== 'all' ||
    selectedSousModuleId !== 'all' ||
    selectedCoursId !== 'all' ||
    searchQuery.trim() !== ''

  return (
    <div className="space-y-6">
      {/* Panneau de Filtrage Hiérarchique Moderne */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 text-sm">🎯</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Filtre & Gestion des Questions
              </h2>
              <p className="text-[11px] text-slate-500">
                Gérez à la fois les QCM / QCU et les Questions Rédactionnelles (QR)
              </p>
            </div>
          </div>

          {/* Onglets de Format : Tous | QCM | Rédactionnelles */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                formatFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous ({questions.length})
            </button>
            <button
              onClick={() => setFormatFilter('qcm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                formatFilter === 'qcm'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📋</span>
              <span>QCM / QCU ({qcmCount})</span>
            </button>
            <button
              onClick={() => setFormatFilter('redaction')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                formatFilter === 'redaction'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>✍️</span>
              <span>Rédactionnelles ({redactionCount})</span>
            </button>
          </div>
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
        <div className="flex items-center gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche par mot-clé dans les énoncés..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <span>↺</span>
              <span>Effacer filtres</span>
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <span>✅</span>
            <span>La question a été enregistrée avec succès !</span>
          </div>
        )}
      </div>

      {/* Résumé des filtres et compteur */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
        <span>
          Affichage de <strong className="text-teal-600 dark:text-teal-400">{filteredQuestions.length}</strong> question(s)
          {hasActiveFilters && ' selon vos critères'}
        </span>
        <span>Cliquez sur « Modifier » pour éditer les réponses, corrigés ou images</span>
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
            const isEditing = editingId === q.id && editingType === q.questionType
            const isRedaction = q.questionType === 'redaction'
            const correctPropsCount = Array.isArray(q.propositions)
              ? q.propositions.filter((p) => p.c).length
              : 0

            const hasImages = Array.isArray(q.images) && q.images.length > 0
            const sousModNom = q.cours?.sousModule?.nom
            const modNom = q.cours?.sousModule?.module?.nom
            const semNom = q.cours?.sousModule?.module?.semestre?.nom

            return (
              <div
                key={`${q.questionType}-${q.id}`}
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isEditing
                    ? isRedaction
                      ? 'bg-purple-50/20 dark:bg-purple-950/20 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-teal-50/20 dark:bg-teal-950/20 border-teal-500 ring-1 ring-teal-500'
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

                      {/* Badge Type de question */}
                      {isRedaction ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold flex items-center gap-1 border border-purple-200/60 dark:border-purple-800">
                          <span>✍️</span>
                          <span>Rédactionnelle / QROC</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {q.type}
                        </span>
                      )}

                      {hasImages && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200/50 flex items-center gap-1">
                          <span>🖼️</span> {q.images!.length} image(s)
                        </span>
                      )}

                      {!isRedaction && correctPropsCount === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/50">
                          ⚠️ 0 réponse cochée
                        </span>
                      )}
                      {!isRedaction && correctPropsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200/50">
                          ✅ {correctPropsCount} réponse(s) cochée(s)
                        </span>
                      )}

                      {isRedaction && !q.reponseModele && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/50">
                          ⚠️ Corrigé type non renseigné
                        </span>
                      )}
                      {isRedaction && q.reponseModele && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200/50">
                          ✅ Corrigé type disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => startEditing(q)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1 ${
                        isRedaction
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
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

                    {/* Images attachées */}
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
                              alt="Illustration"
                              className="object-cover w-full h-full group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                              🔍 Agrandir
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Affichage des Propositions (si QCM) */}
                    {!isRedaction && (
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
                    )}

                    {/* Affichage Réponse Modèle / Corrigé (si Rédactionnelle) */}
                    {isRedaction && q.reponseModele && (
                      <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-950 dark:text-purple-200 space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>📝</span>
                          <span>Corrigé type & Éléments de réponse attendus :</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed">
                          {q.reponseModele}
                        </p>
                        {Array.isArray(q.motsCles) && q.motsCles.length > 0 && (
                          <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/50 flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[11px] text-purple-800 dark:text-purple-300">
                              🔑 Mots-clés :
                            </span>
                            {q.motsCles.map((kw, kwIdx) => (
                              <span
                                key={kwIdx}
                                className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-semibold"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Justification QCM */}
                    {!isRedaction && q.explication && (
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
                        onChange={(e) => setEditData({ ...editData, enonce: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Section Images */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>🖼️</span>
                          <span>Images et schémas associés ({editData.images.length})</span>
                        </label>
                      </div>

                      {editData.images.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {editData.images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 w-28 h-24 bg-white dark:bg-slate-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt="Miniature" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            🔗 Ou coller un lien URL :
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

                    {/* Édition Spécifique QCM : Propositions */}
                    {!isRedaction && (
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
                                onChange={(e) => updatePropositionText(idx, e.target.value)}
                                className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-900 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Édition Spécifique Rédactionnelle : Corrigé modèle & Mots-clés */}
                    {isRedaction && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">
                            📝 Réponse Modèle / Corrigé Type :
                          </label>
                          <textarea
                            rows={4}
                            value={editData.reponseModele}
                            onChange={(e) => setEditData({ ...editData, reponseModele: e.target.value })}
                            placeholder="Rédigez ici la réponse type officielle qui sera présentée à l'étudiant après sa rédaction..."
                            className="w-full p-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">
                            🔑 Mots-clés indispensables (séparés par des virgules) :
                          </label>
                          <input
                            type="text"
                            value={editData.motsClesText}
                            onChange={(e) => setEditData({ ...editData, motsClesText: e.target.value })}
                            placeholder="Ex: fièvre, prurit, érythrodermie, biopsie..."
                            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Justification Médicale pour QCM */}
                    {!isRedaction && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          💡 Explication / Justification du corrigé :
                        </label>
                        <textarea
                          rows={3}
                          value={editData.explication}
                          onChange={(e) => setEditData({ ...editData, explication: e.target.value })}
                          placeholder="Justification médicale ou rappels de cours..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Boutons d'action */}
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
                        className={`px-5 py-2 rounded-xl text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isRedaction
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700'
                            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700'
                        }`}
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
