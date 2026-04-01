'use client'

import { useState } from 'react'
import { AgendaModal } from './AgendaModal'

export function AgendaDayModal({ date, eventos, onClose, onUpdate, userId }: any) {
  const [editing, setEditing] = useState<any>(null)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-[#111] w-full max-w-md p-6 rounded-2xl border border-white/10 space-y-4">

          <div className="flex justify-between items-center">
            <h2 className="text-white font-semibold">{date}</h2>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {eventos.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Nenhum compromisso
            </p>
          ) : (
            <div className="space-y-3">
              {eventos.map((e: any) => (
                <div
                  key={e.id}
                  onClick={() => setEditing(e)}
                  className="cursor-pointer bg-black/30 p-3 rounded-xl border border-white/5 hover:border-white/20"
                >
                  <p className="text-white break-all line-clamp-2 text-sm font-medium">
                    {e.titulo}
                  </p>

                  <p className="text-gray-400 text-xs">
                    {e.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔥 MODAL DE EDIÇÃO CORRIGIDO */}
      {editing && (
        <AgendaModal
          userId={userId}
          initialData={editing}
          onClose={() => setEditing(null)}
          onSaved={(eventoAtualizado: any) => {
            if (onUpdate) onUpdate(eventoAtualizado)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}