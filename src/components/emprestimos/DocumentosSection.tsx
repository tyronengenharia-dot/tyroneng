'use client'

import { useState } from 'react'
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { Select } from '@/components/ui'
import { EmprestimoDocumento, DocumentoTipo } from '@/types/emprestimo'
import {
  createDocumento,
  deleteDocumento,
  uploadAnexo,
} from '@/services/emprestimoService'
import { documentoTipoLabels, documentoTipoOptions } from '@/lib/emprestimoConstants'
import { fmtDate } from '@/lib/utils'

interface Props {
  emprestimoId: string
  documentos: EmprestimoDocumento[]
  onChanged: () => void
}

export function DocumentosSection({ emprestimoId, documentos, onChanged }: Props) {
  const [tipo, setTipo] = useState<DocumentoTipo>('contrato')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | null) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url, path } = await uploadAnexo(file, emprestimoId)
      const { error } = await createDocumento({
        emprestimo_id: emprestimoId,
        nome: file.name,
        tipo,
        url,
        path,
      })
      if (error) setError(error)
      else onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(d: EmprestimoDocumento) {
    if (!confirm(`Excluir o documento "${d.nome}"?`)) return
    const { error } = await deleteDocumento(d.id, d.path)
    if (error) {
      alert(error)
      return
    }
    onChanged()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <Select
            label="Tipo do documento"
            options={documentoTipoOptions}
            value={tipo}
            onChange={e => setTipo(e.target.value as DocumentoTipo)}
          />
        </div>
        <label className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:bg-white/90 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Enviando...' : 'Anexar documento'}
          <input
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            disabled={uploading}
            onChange={e => {
              handleFile(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {documentos.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">
          Nenhum documento anexado. Anexe o contrato, garantias e comprovantes.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {documentos.map(d => (
            <div
              key={d.id}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5"
            >
              <FileText size={18} className="text-white/40 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/80 truncate">{d.nome}</p>
                <p className="text-[10px] text-white/40">
                  {documentoTipoLabels[d.tipo]}
                  {d.created_at ? ` · ${fmtDate(d.created_at.slice(0, 10))}` : ''}
                </p>
              </div>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                title="Abrir"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => handleDelete(d)}
                className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
