'use client'

import { X, ExternalLink } from 'lucide-react'

interface DocumentPreviewProps {
  url: string
  name?: string
  onClose: () => void
}

export default function DocumentPreview({
  url,
  name,
  onClose,
}: DocumentPreviewProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm font-medium text-white truncate max-w-[60%]">
          {name || 'Visualizando documento'}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition"
          >
            <ExternalLink size={12} />
            Abrir externo
          </a>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        <iframe src={url} className="w-full h-full border-0" title={name} />
      </div>
    </div>
  )
}
