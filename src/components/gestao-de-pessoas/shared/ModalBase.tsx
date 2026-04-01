'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalBaseProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export function ModalBase({ title, subtitle, onClose, children, width = 'max-w-lg' }: ModalBaseProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-[#0f0f0f] border border-white/10 rounded-2xl w-full ${width} shadow-2xl`}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ml-4 flex-shrink-0"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
