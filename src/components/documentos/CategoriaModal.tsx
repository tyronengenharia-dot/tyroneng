'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function CategoriaModal({ categoria, onClose, onSave }: any) {
  const [nome, setNome] = useState(categoria?.nome || '')

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (categoria) {
      await supabase
        .from('categorias_documentos')
        .update({ nome })
        .eq('id', categoria.id)
    } else {
      await supabase
        .from('categorias_documentos')
        .insert({ nome, user_id: user.id })
    }

    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4">

        <h2 className="text-lg font-semibold">
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Nome</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg"
          >
            Salvar
          </button>
        </div>

      </div>
    </div>
  )
}