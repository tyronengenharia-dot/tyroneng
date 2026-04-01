'use client'

import { useState } from 'react'
import { getLicitacoes } from '@/services/licitacaoService'
import { LicitacaoCard } from '@/components/licitacoes/LicitacaoCard'
import { LicitacaoForm } from '@/components/licitacoes/LicitacaoForm'

export default function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState(getLicitacoes())

  function reload() {
    setLicitacoes([...getLicitacoes()])
  }

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold">Licitações</h1>

      <LicitacaoForm onCreated={reload} />

      <div className="grid grid-cols-3 gap-4">
        {licitacoes.map(l => (
          <LicitacaoCard key={l.id} lic={l} />
        ))}
      </div>
    </div>
  )
}