'use client'

import { FileText, Download, Trash2, Calendar, Tag } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { AcervoDocument } from '@/types/acervo'

interface DocumentCardProps {
  doc: AcervoDocument
  onDelete?: (id: string) => void
}

const categoryColors: Record<string, string> = {
  ART: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Alvará: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Certificado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Contrato: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Projeto: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Licença: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Habilitação: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Registro: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Outros: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
}

export default function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const catStyle = categoryColors[doc.category] ?? categoryColors.Outros

  return (
    <div className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-900">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{doc.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{doc.sizeMb.toFixed(1)} MB</p>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Category tag */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${catStyle}`}>
          <Tag size={10} />
          {doc.category}
        </span>
        {doc.tags?.map(tag => (
          <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
            {tag}
          </span>
        ))}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {doc.uploadedAt}
        </span>
        {doc.expiresAt && (
          <>
            <span className="text-zinc-700">·</span>
            <span className={`flex items-center gap-1 ${doc.status === 'expired' ? 'text-red-400' : doc.status === 'expiring' ? 'text-amber-400' : ''}`}>
              Vence: {doc.expiresAt}
            </span>
          </>
        )}
      </div>

      {doc.description && (
        <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{doc.description}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition"
        >
          <Download size={12} />
          Download
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(doc.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition"
          >
            <Trash2 size={12} />
            Remover
          </button>
        )}
      </div>
    </div>
  )
}
