'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Phone,
  Mail,
  Plus,
  Upload,
  FilePlus,
} from 'lucide-react'
import StatusBadge from '@/components/acervo/shared/StatusBadge'
import DocumentCard from '@/components/acervo/DocumentCard'
import DocumentModal from '@/components/acervo/modals/DocumentModal'
import type { Professional, AcervoDocument, DocumentFormData } from '@/types/acervo'
import { createDocument } from '@/services/acervoService'

interface ProfessionalCardProps {
  professional: Professional
}

const roleColors: Record<string, string> = {
  'Engenheiro Civil': 'text-blue-400',
  'Engenheiro Elétrico': 'text-yellow-400',
  'Engenheiro Mecânico': 'text-orange-400',
  Arquiteta: 'text-purple-400',
  Arquiteto: 'text-purple-400',
  'Técnico em Edificações': 'text-cyan-400',
  'Mestre de Obras': 'text-amber-400',
  'Gestor de Projetos': 'text-emerald-400',
  'Gestora de Projetos': 'text-emerald-400',
}

export default function ProfessionalCard({ professional: prof }: ProfessionalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [docs, setDocs] = useState<AcervoDocument[]>(prof.documents)

  const roleColor = roleColors[prof.role] ?? 'text-zinc-400'
  const initials = prof.name.split(' ').slice(0, 2).map((n) => n[0]).join('')

  async function handleAddDoc(formData: DocumentFormData) {
    setSaving(true)
    try {
      const doc = await createDocument(formData, {
        type: 'professional',
        professionalId: prof.id,
      })
      setDocs((prev) => [doc, ...prev])
      setShowDocModal(false)
      // garante que expande para mostrar o doc recém adicionado
      setExpanded(true)
    } catch (err: any) {
      alert(err.message ?? 'Erro ao salvar documento')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteDoc(docId: string) {
    setDocs((prev) => prev.filter((d) => d.id !== docId))
  }

  return (
    <>
      <div
        className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
          expanded
            ? 'border-zinc-600 bg-zinc-900'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
        }`}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 p-4 sm:p-5">

          {/* Avatar — clica para expandir */}
          <div
            className="cursor-pointer shrink-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {prof.avatar ? (
              <img
                src={prof.avatar}
                alt={prof.name}
                className="w-11 h-11 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                {initials}
              </div>
            )}
          </div>

          {/* Info — clica para expandir */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{prof.name}</span>
              {!prof.active && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-700 text-zinc-400">
                  Inativo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-medium ${roleColor}`}>{prof.role}</span>
              <span className="text-zinc-600 text-xs">·</span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <BadgeCheck size={11} />
                {prof.registrationNumber}
              </span>
            </div>
          </div>

          {/* Direita — status + botões sempre visíveis */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:block text-xs text-zinc-500">
              {docs.length} doc{docs.length !== 1 ? 's' : ''}
            </span>

            <StatusBadge status={prof.documentStatus} />

            {/* ✅ BOTÃO ADICIONAR DOCUMENTO — sempre no header */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDocModal(true)
              }}
              title="Adicionar documento"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8f65d]/10 hover:bg-[#c8f65d]/20 text-[#c8f65d] border border-[#c8f65d]/25 rounded-lg text-xs font-medium transition"
            >
              <FilePlus size={13} />
              <span className="hidden sm:inline">Adicionar doc</span>
            </button>

            {/* Chevron expand */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition"
            >
              {expanded ? (
                <ChevronUp size={16} className="text-zinc-500" />
              ) : (
                <ChevronDown size={16} className="text-zinc-500" />
              )}
            </button>
          </div>
        </div>

        {/* ── BODY EXPANDIDO ── */}
        {expanded && (
          <div className="border-t border-zinc-800 p-5 space-y-5">

            {/* Contato + Especialidades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Contato
                </p>
                <div className="space-y-1.5">
                  {prof.email && (
                    <a
                      href={`mailto:${prof.email}`}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition"
                    >
                      <Mail size={12} />
                      {prof.email}
                    </a>
                  )}
                  {prof.phone && (
                    <a
                      href={`tel:${prof.phone}`}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition"
                    >
                      <Phone size={12} />
                      {prof.phone}
                    </a>
                  )}
                </div>
              </div>

              {prof.specialty.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {prof.specialty.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documentos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Documentos ({docs.length})
                </p>
                {/* botão repetido aqui dentro para facilitar quando expandido */}
                <button
                  onClick={() => setShowDocModal(true)}
                  className="flex items-center gap-1.5 text-xs text-[#c8f65d] hover:text-white transition font-medium"
                >
                  <Plus size={13} />
                  Adicionar documento
                </button>
              </div>

              {docs.length === 0 ? (
                <button
                  onClick={() => setShowDocModal(true)}
                  className="w-full flex flex-col items-center gap-2 py-8 text-zinc-600 hover:text-zinc-400 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl transition"
                >
                  <Upload size={22} className="opacity-60" />
                  <span className="text-sm">Nenhum documento — clique para adicionar</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDeleteDoc}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDocModal && (
        <DocumentModal
          title={`Novo Documento — ${prof.name}`}
          onClose={() => setShowDocModal(false)}
          onSave={handleAddDoc}
          loading={saving}
        />
      )}
    </>
  )
}
