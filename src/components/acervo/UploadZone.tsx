'use client'

import { useCallback, useState } from 'react'
import { UploadCloud, FileText, X, CheckCircle, Loader2 } from 'lucide-react'
import type { DocumentCategory } from '@/types/acervo'

const CATEGORIES: DocumentCategory[] = [
  'ART', 'Alvará', 'Certificado', 'Contrato',
  'Projeto', 'Licença', 'Habilitação', 'Registro', 'Outros',
]

interface UploadZoneProps {
  onUpload: (file: File, category: DocumentCategory) => Promise<void>
  label?: string
}

export default function UploadZone({ onUpload, label = 'documento' }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<DocumentCategory>('Outros')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    setStatus('loading')
    try {
      await onUpload(file, category)
      setStatus('done')
      setTimeout(() => {
        setStatus('idle')
        setFile(null)
      }, 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop Area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${dragging
            ? 'border-[#c8f65d] bg-[#c8f65d]/5'
            : file
            ? 'border-zinc-600 bg-zinc-900/50'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
          }`}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFile}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={20} className="text-[#c8f65d]" />
            <div className="text-left">
              <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1_000_000).toFixed(2)} MB</p>
            </div>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setFile(null) }}
              className="ml-auto text-zinc-500 hover:text-red-400 transition"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <UploadCloud size={28} />
            <p className="text-sm">
              Arraste ou <span className="text-[#c8f65d]">clique para selecionar</span>
            </p>
            <p className="text-xs">PDF, DOC, JPG até 20 MB</p>
          </div>
        )}
      </div>

      {/* Category + Submit */}
      {file && (
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value as DocumentCategory)}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#c8f65d]/50"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || status === 'done'}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition
              ${status === 'done'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-[#c8f65d] text-black hover:bg-[#d4f97a]'
              } disabled:opacity-60`}
          >
            {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
            {status === 'done' && <CheckCircle size={14} />}
            {status === 'loading' ? 'Enviando...' : status === 'done' ? 'Enviado!' : `Salvar ${label}`}
          </button>
        </div>
      )}
    </div>
  )
}
