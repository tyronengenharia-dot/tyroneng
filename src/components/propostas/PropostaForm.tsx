'use client'

import { useState } from 'react'
import { Proposta, EscopaMaterial } from '@/types/proposta'

interface Props {
  onSubmit: (data: Proposta) => void
  initialData?: Partial<Proposta>
}

// ─── Estilos reutilizáveis ────────────────────────────────────────────────────
const input = [
  'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5',
  'text-sm text-zinc-100 placeholder:text-zinc-600',
  'focus:outline-none focus:border-amber-700/60 transition-colors',
].join(' ')

const label = 'block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5'

// ─── Seção do formulário ──────────────────────────────────────────────────────
function Section({ title, page, children }: { title: string; page: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-800 pt-5 mt-1">
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">{title}</p>
        <span className="text-[10px] text-zinc-600 font-mono">{page}</span>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

// ─── Componente de campo de array (etapas / entregáveis) ──────────────────────
function ArrayField({
  label: lbl,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const text = value.join('\n')

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value.split('\n'))
  }

  return (
    <div>
      <p className={label}>{lbl}{hint && <span className="normal-case text-zinc-700 ml-1">({hint})</span>}</p>
      <textarea
        className={`${input} resize-none`}
        rows={5}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  )
}

// ─── Formulário principal ─────────────────────────────────────────────────────
export function PropostaForm({ onSubmit, initialData }: Props) {
  const [form, setForm] = useState<Partial<Proposta>>({
    numero: '',
    cliente: '',
    tituloCapa: '',
    dataEmissao: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
    objetivo: '',
    etapas: [],
    prazoExecucao: 30,
    entregaveis: ['PROJETO ESTRUTURAL', 'ART - CREA/RJ'],
    valor: 0,
    valorExtenso: '',
    escopaMaterial: 'mao_de_obra_e_materiais',
    condicoesPagamento: 'O pagamento inicial será de 50% (cinquenta por cento) do valor para início dos serviços e os outros 50% após a finalização do mesmo.',
    validade: 30,
    descricaoNF: '',
    responsavel: 'Rodrigo Antunes Ramos',
    crea: 'CREA/RJ 2019103029',
    ...initialData,
  })

  function set(key: keyof Proposta, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    const proposta: Proposta = {
      id:              form.id || crypto.randomUUID(),
      numero:          form.numero || `${346000 + Math.floor(Math.random() * 999)}`,
      cliente:         form.cliente || '',
      tituloCapa:      form.tituloCapa || (form.cliente || '').toUpperCase(),
      dataEmissao:     form.dataEmissao || '',
      objetivo:        form.objetivo || '',
      etapas:          (form.etapas || []).filter(Boolean),
      prazoExecucao:   Number(form.prazoExecucao) || 30,
      entregaveis:     (form.entregaveis || []).filter(Boolean),
      valor:           Number(String(form.valor).replace(/\./g, '').replace(',', '.')) || 0,
      valorExtenso:    form.valorExtenso || '',
      escopaMaterial:  form.escopaMaterial || 'mao_de_obra_e_materiais',
      condicoesPagamento: form.condicoesPagamento || '',
      validade:        Number(form.validade) || 30,
      descricaoNF:     form.descricaoNF || '',
      responsavel:     form.responsavel || 'Rodrigo Antunes Ramos',
      crea:            form.crea || 'CREA/RJ 2019103029',
      status:          form.status || 'rascunho',
      createdAt:       form.createdAt || new Date().toISOString(),
    }
    onSubmit(proposta)
  }

  return (
    <div className="grid gap-1">

      {/* ── CAPA ── */}
      <Section title="Capa" page="Página de capa">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={label}>Nº da Proposta</p>
            <input className={input} placeholder="Ex: 345.970"
              value={form.numero || ''} onChange={e => set('numero', e.target.value)} />
          </div>
          <div>
            <p className={label}>Data de Emissão</p>
            <input className={input} placeholder="Ex: 11 de Abril de 2026"
              value={form.dataEmissao || ''} onChange={e => set('dataEmissao', e.target.value)} />
          </div>
        </div>

        <div>
          <p className={label}>Cliente / Contratante</p>
          <input className={input} placeholder="Ex: Condomínio Blu Sky — Cachoeiras de Macacu"
            value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} />
        </div>

        <div>
          <p className={label}>
            Título da Capa{' '}
            <span className="normal-case text-zinc-700">(texto grande — use Enter para nova linha)</span>
          </p>
          <textarea
            className={`${input} resize-none`}
            rows={3}
            placeholder={'Ex:\nBASE\nCAIXAS DE ÁGUA'}
            value={form.tituloCapa || ''}
            onChange={e => set('tituloCapa', e.target.value)}
          />
          <p className="text-[10px] text-zinc-700 mt-1">
            Cada linha vira uma linha do título enorme da capa.
          </p>
        </div>
      </Section>

      {/* ── OBJETIVOS ── */}
      <Section title="Objetivos" page="Página 1">
        <div>
          <p className={label}>Parágrafo de Objetivos</p>
          <textarea
            className={`${input} resize-none`}
            rows={5}
            placeholder="O objetivo principal é a execução da construção de..."
            value={form.objetivo || ''}
            onChange={e => set('objetivo', e.target.value)}
          />
        </div>
      </Section>

      {/* ── DETALHAMENTO ── */}
      <Section title="Detalhamento do Serviço" page="Página 2">
        <ArrayField
          label="Etapas do Serviço"
          hint="uma por linha"
          value={form.etapas || []}
          onChange={v => set('etapas', v)}
          placeholder={
            'Mobilização da equipe e demarcação da área\nLimpeza e preparo do terreno\nMontagem da armação em aço\nConcretagem com adensamento adequado\nCura do concreto pelo período recomendado'
          }
        />
      </Section>

      {/* ── CRONOGRAMA ── */}
      <Section title="Cronograma" page="Página 4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={label}>Prazo de Execução (dias)</p>
            <input className={input} type="number" placeholder="30"
              value={form.prazoExecucao || ''} onChange={e => set('prazoExecucao', Number(e.target.value))} />
            <p className="text-[10px] text-zinc-700 mt-1">
              Será escrito por extenso automaticamente.
            </p>
          </div>
        </div>
      </Section>

      {/* ── ENTREGÁVEIS + INVESTIMENTO ── */}
      <Section title="Entregáveis e Investimento" page="Página 5">
        <ArrayField
          label="Entregáveis"
          hint="um por linha, em CAPS"
          value={form.entregaveis || []}
          onChange={v => set('entregaveis', v)}
          placeholder={'PROJETO ESTRUTURAL\nLAJE DE APROXIMADAMENTE 80 M² EM CONCRETO ARMADO\nART - CREA/RJ'}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={label}>Valor Total (R$)</p>
            <input className={input} placeholder="Ex: 49.667,30"
              value={form.valor ? String(form.valor) : ''}
              onChange={e => set('valor', e.target.value)} />
          </div>
          <div>
            <p className={label}>Valor por Extenso</p>
            <input className={input}
              placeholder="quarenta e nove mil, seiscentos e sessenta e sete reais e trinta centavos"
              value={form.valorExtenso || ''}
              onChange={e => set('valorExtenso', e.target.value)} />
          </div>
        </div>

        <div>
          <p className={label}>O valor contempla</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'mao_de_obra', label: 'Mão de obra', desc: 'Apenas mão de obra e execução' },
              { v: 'mao_de_obra_e_materiais', label: 'Mão de obra + Materiais', desc: 'Inclui todos os materiais' },
            ].map(opt => {
              const active = form.escopaMaterial === opt.v
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('escopaMaterial', opt.v as EscopaMaterial)}
                  className={`
                    text-left p-3 rounded-lg border transition-all
                    ${active
                      ? 'bg-amber-950/50 border-amber-700/50'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
                  `}
                >
                  <p className={`text-xs font-semibold ${active ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ── PAGAMENTO ── */}
      <Section title="Forma de Pagamento" page="Página 6">
        <div>
          <p className={label}>
            Condições de Pagamento{' '}
            <span className="normal-case text-zinc-700">(item 4.2 do contrato)</span>
          </p>
          <textarea
            className={`${input} resize-none`}
            rows={3}
            placeholder="O pagamento inicial será de 50% (cinquenta por cento) do valor para início dos serviços e os outros 50% após a finalização do mesmo."
            value={form.condicoesPagamento || ''}
            onChange={e => set('condicoesPagamento', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={label}>Validade da Proposta (dias)</p>
            <input className={input} type="number" placeholder="30"
              value={form.validade || ''} onChange={e => set('validade', Number(e.target.value))} />
          </div>
        </div>

        <div>
          <p className={label}>
            Descrição na Nota Fiscal{' '}
            <span className="normal-case text-zinc-700">(em CAPS)</span>
          </p>
          <textarea
            className={`${input} resize-none uppercase`}
            rows={2}
            placeholder="EXECUÇÃO DE LAJE ESTRUTURAL EM CONCRETO ARMADO PARA 6 CAIXAS DE ÁGUA DE 15 MIL LITROS CADA, TOTALIZANDO 90 MIL LITROS."
            value={form.descricaoNF || ''}
            onChange={e => set('descricaoNF', e.target.value.toUpperCase())}
          />
        </div>
      </Section>

      {/* ── RESPONSÁVEL TÉCNICO ── */}
      <Section title="Responsável Técnico" page="Página 6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={label}>Engenheiro Responsável</p>
            <input className={input} value={form.responsavel || ''}
              onChange={e => set('responsavel', e.target.value)} />
          </div>
          <div>
            <p className={label}>CREA</p>
            <input className={input} value={form.crea || ''}
              onChange={e => set('crea', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ── Botão ── */}
      <div className="pt-4 mt-2">
        <button
          onClick={handleSubmit}
          className="
            w-full py-3 rounded-lg bg-amber-500 text-zinc-950
            font-semibold text-sm tracking-wide
            hover:bg-amber-400 active:scale-[0.99]
            transition-all duration-150
          "
        >
          ⟳ Gerar Proposta
        </button>
      </div>
    </div>
  )
}
