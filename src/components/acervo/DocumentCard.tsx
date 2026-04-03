'use client'

import { useState } from 'react'
import { FileText, Download, Trash2, Tag, Calendar, Eye, ExternalLink } from 'lucide-react'
import StatusBadge from '@/components/acervo/shared/StatusBadge'
import DocumentPreview from '@/components/acervo/shared/DocumentPreview'
import type { AcervoDocument } from '@/types/acervo'
import { CATEGORY_COLORS } from '@/lib/constants'
import { getExpiryDisplay, formatDate } from '@/lib/dateUtils'
import { deleteDocument } from '@/services/acervoService'

interface DocumentCardProps {
  doc: AcervoDocument
  onDelete?: (id: string) => void
  compact?: boolean
}

export default function DocumentCard({
  doc,
  onDelete,
  compact = false,
}: DocumentCardProps) {
  const [previewing, setPreviewing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const catStyle = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.Outros
  const expiry = getExpiryDisplay(doc.expiresAt, doc.diasRenovar)

  const expiryColorClass =
    expiry?.level === 'danger'
      ? 'text-red-400'
      : expiry?.level === 'warn'
      ? 'text-amber-400'
      : 'text-zinc-500'

  async function handleDownload() {
    if (!doc.fileUrl || doc.fileUrl === '#') return
    try {
      const res = await fetch(doc.fileUrl)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao baixar arquivo')
    }
  }

  async function handleDelete() {
    if (!confirm('Remover este documento?')) return
    setDeleting(true)
    try {
      await deleteDocument(doc.id, doc.arquivoPath)
      onDelete?.(doc.id)
    } catch (err: any) {
      alert(err.message ?? 'Erro ao remover documento')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className={`group relative bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all duration-200 hover:bg-zinc-900 ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <FileText size={compact ? 14 : 16} className="text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p
                className={`font-medium text-white truncate leading-tight ${
                  compact ? 'text-xs' : 'text-sm'
                }`}
              >
                {doc.name}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {doc.sizeMb > 0 ? `${doc.sizeMb.toFixed(1)} MB` : '—'}
              </p>
            </div>
          </div>
          <StatusBadge status={doc.status} size={compact ? 'sm' : 'md'} />
        </div>

        {/* Category + tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${catStyle}`}
          >
            <Tag size={9} />
            {doc.category}
          </span>
          {doc.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta: data upload + vencimento */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 mb-2.5">
          {doc.uploadedAt && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(doc.uploadedAt)}
            </span>
          )}
          {expiry && (
            <>
              <span className="text-zinc-700">·</span>
              <span className={expiryColorClass}>{expiry.text}</span>
            </>
          )}
        </div>

        {/* Orgão + número */}
        {(doc.orgao || doc.numero) && !compact && (
          <div className="text-[11px] text-zinc-600 mb-2.5 space-y-0.5">
            {doc.orgao && <p>Órgão: {doc.orgao}</p>}
            {doc.numero && <p>Nº {doc.numero}</p>}
          </div>
        )}

        {doc.description && !compact && (
          <p className="text-[11px] text-zinc-600 mb-3 leading-relaxed">
            {doc.description}
          </p>
        )}

        {/* Actions — aparecem no hover */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap mt-1">
          {doc.fileUrl && (
            <button
              onClick={() => setPreviewing(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[11px] border border-blue-500/20 transition"
            >
              <Eye size={11} />
              Visualizar
            </button>
          )}

          {doc.urlEmissao && (
            <a
              href={
                doc.urlEmissao.startsWith('http')
                  ? doc.urlEmissao
                  : `https://${doc.urlEmissao}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-[11px] border border-zinc-700 transition"
            >
              <ExternalLink size={11} />
              Emissão
            </a>
          )}

          {doc.fileUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-[11px] border border-zinc-700 transition"
            >
              <Download size={11} />
              Download
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[11px] border border-red-500/20 transition disabled:opacity-50"
            >
              <Trash2 size={11} />
              {deleting ? 'Removendo...' : 'Remover'}
            </button>
          )}
        </div>
      </div>

      {previewing && doc.fileUrl && (
        <DocumentPreview
          url={doc.fileUrl}
          name={doc.name}
          onClose={() => setPreviewing(false)}
        />
      )}
    </>
  )
}
