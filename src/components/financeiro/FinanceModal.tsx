'use client'

import { useEffect, useRef } from 'react'

export function FinanceModal({ onClose, initialData, onSuccess }: any) {
  const modalRef = useRef<HTMLDivElement>(null)

  // clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      
      <div
        ref={modalRef}
        className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <h2 className="text-xl font-semibold mb-6 text-white">
          {initialData ? 'Editar transação' : 'Nova transação'}
        </h2>

        <div className="space-y-4">
          <input
            placeholder="Descrição"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white"
          />

          <input
            placeholder="Valor"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white"
          />

          <input
            type="date"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white"
          />

          <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Cancelar
          </button>

          <button className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:scale-105 transition">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}