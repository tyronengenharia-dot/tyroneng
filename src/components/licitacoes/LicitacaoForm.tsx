'use client'

import { useState } from 'react'
import { createLicitacao } from '@/services/licitacaoService'

export function LicitacaoForm({ onCreated }: any) {
  const [titulo, setTitulo] = useState('')

  function handleCreate() {
    const nova = {
      id: crypto.randomUUID(),
      titulo,
      orgao: '',
      local: '',
      valorEstimado: 0,
      dataEntrega: '',
      status: 'analise',
      checklist: []
    }

    createLicitacao(nova)
    onCreated()
    setTitulo('')
  }

  return (
    <div className="flex gap-2">
      <input
        className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded w-full"
        placeholder="Nome da licitação"
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
      />

      <button
        onClick={handleCreate}
        className="bg-blue-600 px-4 rounded hover:bg-blue-700"
      >
        Criar
      </button>
    </div>
  )
}