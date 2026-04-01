'use client'

import { useState } from 'react'
import { Proposta } from '@/types/proposta'

export function PropostaForm({
  onSubmit
}: {
  onSubmit: (data: Proposta) => void
}) {
  const [form, setForm] = useState<any>({})

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit() {
    const proposta: Proposta = {
      id: Date.now().toString(),
      ...form,
      valor: Number(form.valor),
      prazoExecucao: Number(form.prazoExecucao),
      validade: Number(form.validade),
      status: 'rascunho',
      createdAt: new Date().toISOString()
    }

    onSubmit(proposta)
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <input name="cliente" placeholder="Cliente" className="input" onChange={handleChange} />
      <input name="obra" placeholder="Obra" className="input" onChange={handleChange} />
      <textarea name="descricao" placeholder="Descrição" className="input" onChange={handleChange} />
      <input name="valor" placeholder="Valor" className="input" onChange={handleChange} />
      <input name="prazoExecucao" placeholder="Prazo (dias)" className="input" onChange={handleChange} />
      <input name="validade" placeholder="Validade (dias)" className="input" onChange={handleChange} />
      <textarea name="condicoesPagamento" placeholder="Condições" className="input" onChange={handleChange} />

      <button className="button" onClick={handleSubmit}>
        Gerar Proposta
      </button>
    </div>
  )
}