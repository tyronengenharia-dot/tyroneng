'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Upload, BadgeCheck, Phone, Mail, Plus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import DocumentCard from './DocumentCard'
import UploadZone from './UploadZone'
import type { Professional, AcervoDocument, DocumentCategory } from '@/types/acervo'
import { uploadDocument } from '@/services/acervoService'

interface ProfessionalCardProps {
  professional: Professional
  onDocumentAdded?: (profId: string, doc: AcervoDocument) => void
}

const roleColors: Record<string, string> = {
  'Engenheiro Civil': 'text-blue-400',
  'Engenheiro Elétrico': 'text-yellow-400',
  'Engenheiro Mecânico': 'text-orange-400',
  'Arquiteto': 'text-purple-400',
  'Técnico em Edificações': 'text-cyan-400',
  'Mestre de Obras': 'text-amber-400',
  'Gestor de Projetos': 'text-emerald-400',
}

export default function ProfessionalCard({ professional: prof, onDocumentAdded }: ProfessionalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [docs, setDocs] = useState<AcervoDocument[]>(prof.documents)

  const roleColor = roleColors[prof.role] ?? 'text-zinc-400'
  const initials = prof.name.split(' ').slice(0, 2).map(n => n[0]).join('')

  const handleUpload = async (file: File, category: DocumentCategory) => {
    const doc = await uploadDocument(file, { type: 'professional', professionalId: prof.id }, category)
    setDocs(prev => [...prev, doc])
    onDocumentAdded?.(prof.id, doc)
    setShowUpload(false)
  }

  const handleDelete = (docId: string) => {
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div className={`border rounded-2xl transition-all duration-300 overflow-hidden
      ${expanded ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
      
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Avatar */}
        {prof.avatar ? (
          <img src={prof.avatar} alt={prof.name} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{prof.name}</span>
            {!prof.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-700 text-zinc-400">Inativo</span>
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

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-zinc-500">{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>
          </div>
          <StatusBadge status={prof.documentStatus} />
          {expanded ? (
            <ChevronUp size={16} className="text-zinc-500" />
          ) : (
            <ChevronDown size={16} className="text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-zinc-800 p-5 space-y-5">
          {/* Contact & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contato</p>
              <div className="space-y-1.5">
                <a href={`mailto:${prof.email}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
                  <Mail size={12} />
                  {prof.email}
                </a>
                <a href={`tel:${prof.phone}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
                  <Phone size={12} />
                  {prof.phone}
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {prof.specialty.map(s => (
                  <span key={s} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Documentos ({docs.length})
              </p>
              <button
                onClick={() => setShowUpload(v => !v)}
                className="flex items-center gap-1.5 text-xs text-[#c8f65d] hover:text-white transition"
              >
                {showUpload ? <ChevronUp size={13} /> : <Plus size={13} />}
                {showUpload ? 'Fechar' : 'Adicionar'}
              </button>
            </div>

            {showUpload && (
              <div className="mb-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <UploadZone onUpload={handleUpload} label="documento do profissional" />
              </div>
            )}

            {docs.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 text-sm">
                <Upload size={24} className="mx-auto mb-2 opacity-50" />
                Nenhum documento cadastrado
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {docs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
