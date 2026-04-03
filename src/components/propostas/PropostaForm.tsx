'use client'

import { useState } from 'react'
import { Proposta } from '@/types/proposta'

interface Props {
  onSubmit: (data: Proposta) => void
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-700/60 transition-colors'

const labelCls =
  'block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5'

export function PropostaForm({ onSubmit }: Props) {
  const [form, setForm] = useState({
    numero: '',
    cliente: '',
    obra: '',
    descricao: '',
    etapas: '',
    valor: '',
    prazoExecucao: '',
    validade: '',
    responsavel: 'Rodrigo Antunes Ramos',
    crea: 'CREA/RJ 2019103029',
    condicoesPagamento: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit() {
    const proposta: Proposta = {
      id: Date.now().toString(),
      numero: form.numero || `${346000 + Math.floor(Math.random() * 999)}`,
      cliente: form.cliente,
      obra: form.obra,
      descricao: form.descricao,
      etapas: form.etapas
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      valor: Number(form.valor.replace(/\D/g, '')) / 100,
      prazoExecucao: Number(form.prazoExecucao),
      validade: Number(form.validade),
      responsavel: form.responsavel,
      crea: form.crea,
      condicoesPagamento: form.condicoesPagamento,
      status: 'rascunho',
      createdAt: new Date().toISOString(),
    }
    onSubmit(proposta)
  }

  return (
    <div className="grid gap-5">
      {/* Identificação */}
      <section>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest pb-2 mb-4 border-b border-zinc-800">
          Identificação
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cliente / Contratante</label>
            <input
              name="cliente"
              className={inputCls}
              placeholder="Nome ou razão social"
              value={form.cliente}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>Nº da Proposta</label>
            <input
              name="numero"
              className={inputCls}
              placeholder="Ex: 346.100 (auto se vazio)"
              value={form.numero}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Projeto */}
      <section>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest pb-2 mb-4 border-b border-zinc-800">
          Projeto
        </p>
        <div className="grid gap-4">
          <div>
            <label className={labelCls}>Nome do Projeto / Obra</label>
            <input
              name="obra"
              className={inputCls}
              placeholder="Ex: Base de Concreto — 6 Caixas d'Água"
              value={form.obra}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>Descrição do Serviço</label>
            <textarea
              name="descricao"
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Descreva o escopo principal do serviço..."
              value={form.descricao}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>
              Etapas / Detalhamento{' '}
              <span className="normal-case text-zinc-700">(uma por linha)</span>
            </label>
            <textarea
              name="etapas"
              className={`${inputCls} resize-none`}
              rows={5}
              placeholder={
                'Mobilização da equipe\nPreparação do terreno\nArmação em aço\nConcretagem\nCura do concreto'
              }
              value={form.etapas}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Valores */}
      <section>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest pb-2 mb-4 border-b border-zinc-800">
          Valores e Prazos
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Valor Total (R$)</label>
            <input
              name="valor"
              className={inputCls}
              placeholder="Ex: 49.667,30"
              value={form.valor}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>Prazo de Execução (dias)</label>
            <input
              name="prazoExecucao"
              className={inputCls}
              placeholder="Ex: 30"
              value={form.prazoExecucao}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>Validade da Proposta (dias)</label>
            <input
              name="validade"
              className={inputCls}
              placeholder="Ex: 30"
              value={form.validade}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>Condições de Pagamento</label>
            <input
              name="condicoesPagamento"
              className={inputCls}
              placeholder="Ex: 50% início + 50% conclusão"
              value={form.condicoesPagamento}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Responsável */}
      <section>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest pb-2 mb-4 border-b border-zinc-800">
          Responsável Técnico
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Engenheiro Responsável</label>
            <input
              name="responsavel"
              className={inputCls}
              value={form.responsavel}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelCls}>CREA</label>
            <input
              name="crea"
              className={inputCls}
              value={form.crea}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <button
        onClick={handleSubmit}
        className="
          w-full py-3 rounded-lg bg-amber-500 text-zinc-950 font-semibold
          text-sm tracking-wide hover:bg-amber-400 active:scale-[0.99]
          transition-all duration-150 mt-1
        "
      >
        ⟳ Gerar Proposta
      </button>
    </div>
  )
}
