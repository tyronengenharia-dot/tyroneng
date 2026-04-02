'use client'

import { useState, useEffect, useRef } from 'react'
import type { CotacaoFornecedor, Fornecedor, SolicitacaoCompra, FormaPagamento } from '@/types/compras'
import { createCotacao, getFornecedores } from '@/services/comprasService'

interface Props {
  aberto: boolean
  solicitacao: SolicitacaoCompra | null
  onFechar: () => void
  onCriada: (nova: CotacaoFornecedor) => void
}

type Campos = {
  fornecedor_id: string
  fornecedor: string
  cnpj: string
  contato: string
  email: string
  telefone: string
  valor: string
  prazo_dias: string
  validade_dias: string
  condicoes: string
  forma_pagamento: FormaPagamento
  frete_incluso: boolean
}

const VAZIO: Campos = {
  fornecedor_id: '',
  fornecedor: '',
  cnpj: '',
  contato: '',
  email: '',
  telefone: '',
  valor: '',
  prazo_dias: '',
  validade_dias: '30',
  condicoes: '',
  forma_pagamento: 'a_vista',
  frete_incluso: false,
}

const PAGAMENTOS: { value: FormaPagamento; label: string }[] = [
  { value: 'a_vista', label: 'À vista' },
  { value: '7_dias',  label: '7 dias' },
  { value: '14_dias', label: '14 dias' },
  { value: '30_dias', label: '30 dias' },
  { value: '60_dias', label: '60 dias' },
]

const inputCls =
  'w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'

const selectCls =
  'w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-200 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none cursor-pointer'

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
      {text}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  )
}

// ─── Autocomplete de fornecedor ───────────────────────────────────────────────

interface AutocompleteProps {
  fornecedores: Fornecedor[]
  carregando: boolean
  erroCarregamento: string | null
  fornecedorSelecionado: Fornecedor | null
  onSelecionar: (f: Fornecedor | null) => void
  erro?: string
}

function AutocompleteFornecedor({
  fornecedores,
  carregando,
  erroCarregamento,
  fornecedorSelecionado,
  onSelecionar,
  erro,
}: AutocompleteProps) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [idx, setIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // Filtra por nome, razão social, cnpj ou categoria
  const filtrados = busca.trim()
    ? fornecedores.filter((f) => {
        const q = busca.toLowerCase()
        return (
          f.nome.toLowerCase().includes(q) ||
          (f.razao_social ?? '').toLowerCase().includes(q) ||
          (f.cnpj ?? '').includes(q) ||
          (f.categoria ?? '').toLowerCase().includes(q)
        )
      })
    : fornecedores

  // Fecha ao clicar fora
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !listaRef.current?.contains(e.target as Node)
      ) setAberto(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Reseta busca quando seleção é limpa externamente
  useEffect(() => {
    if (!fornecedorSelecionado) setBusca('')
  }, [fornecedorSelecionado])

  function selecionar(f: Fornecedor) {
    setBusca(f.nome)
    setAberto(false)
    setIdx(-1)
    onSelecionar(f)
  }

  function limpar() {
    setBusca('')
    setAberto(true)
    onSelecionar(null)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); setAberto(true) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtrados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); selecionar(filtrados[idx]) }
    else if (e.key === 'Escape') setAberto(false)
  }

  const selecionado = !!fornecedorSelecionado

  return (
    <div className="relative">
      {/* Campo de busca */}
      <div className={`flex items-center gap-2 rounded-lg border bg-zinc-800/60 px-3 py-2 transition-all ${
        erro ? 'border-red-500/60' :
        aberto ? 'border-indigo-500 ring-1 ring-indigo-500/30' :
        'border-zinc-700/60 hover:border-zinc-600/80'
      }`}>
        {carregando ? (
          <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" strokeOpacity="0.25"/><path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
          </svg>
        ) : selecionado ? (
          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 shrink-0 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3 3" strokeLinecap="round"/>
          </svg>
        )}

        <input
          ref={inputRef}
          type="text"
          value={selecionado ? fornecedorSelecionado!.nome : busca}
          onChange={e => {
            if (selecionado) return // se selecionado, só limpar via botão
            setBusca(e.target.value)
            setAberto(true)
            setIdx(-1)
          }}
          onFocus={() => { if (!selecionado) setAberto(true) }}
          onKeyDown={onKeyDown}
          readOnly={selecionado}
          placeholder={carregando ? 'Carregando fornecedores...' : 'Buscar por nome, CNPJ ou categoria...'}
          className={`flex-1 bg-transparent text-[12px] outline-none ${
            selecionado ? 'cursor-default text-zinc-200' : 'text-zinc-200 placeholder-zinc-600'
          }`}
        />

        {(busca || selecionado) && (
          <button type="button" onClick={limpar} className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {aberto && !selecionado && !carregando && (
        <div
          ref={listaRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-700/60 bg-zinc-900 shadow-2xl"
        >
          {erroCarregamento ? (
            <div className="px-4 py-6 text-center text-[11px] text-red-400">{erroCarregamento}</div>
          ) : filtrados.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[12px] text-zinc-400">Nenhum fornecedor encontrado</p>
              <p className="mt-1 text-[10px] text-zinc-600">
                {busca ? `Sem resultados para "${busca}"` : 'Nenhum fornecedor cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-zinc-800/60 px-3 py-1.5">
                <span className="text-[10px] text-zinc-600">
                  {filtrados.length} fornecedor{filtrados.length !== 1 ? 'es' : ''}
                </span>
              </div>
              {filtrados.map((f, i) => {
                const ativo = f.status?.toLowerCase() === 'ativo' || f.ativo !== false
                return (
                  <button
                    key={f.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); selecionar(f) }}
                    onMouseEnter={() => setIdx(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === idx ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                    } ${i !== filtrados.length - 1 ? 'border-b border-zinc-800/40' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-[12px] font-bold text-indigo-400">
                      {f.nome.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] font-medium text-zinc-200">{f.nome}</p>
                        {f.razao_social && f.razao_social !== f.nome && (
                          <p className="truncate text-[10px] text-zinc-500">{f.razao_social}</p>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                        {f.cnpj && <span className="font-mono">{f.cnpj}</span>}
                        {f.categoria && <><span className="text-zinc-700">·</span><span>{f.categoria}</span></>}
                        {f.cidade && <><span className="text-zinc-700">·</span><span>{f.cidade}{f.estado ? `/${f.estado}` : ''}</span></>}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {ativo ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">Ativo</span>
                      ) : (
                        <span className="rounded-full bg-zinc-700/30 px-2 py-0.5 text-[9px] font-semibold text-zinc-500">Inativo</span>
                      )}
                      {f.avaliacao != null && f.avaliacao > 0 && (
                        <div className="flex items-center gap-0.5">
                          <svg className="h-2.5 w-2.5 text-amber-400" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10.5l.6-3.2L1.2 5l3.3-.5z"/>
                          </svg>
                          <span className="text-[10px] text-zinc-500">{Number(f.avaliacao).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}

      {erro && <p className="mt-1 text-[10px] text-red-400">{erro}</p>}
    </div>
  )
}

// ─── Card de dados do fornecedor selecionado ─────────────────────────────────

function CardFornecedor({ f }: { f: Fornecedor }) {
  const ativo = f.status?.toLowerCase() === 'ativo' || f.ativo !== false

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/25 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-[13px] font-bold text-indigo-400">
          {f.nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-zinc-200">{f.nome}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/30 text-zinc-500'
            }`}>
              {f.status ?? (ativo ? 'Ativo' : 'Inativo')}
            </span>
          </div>
          {f.razao_social && (
            <p className="text-[10px] text-zinc-500">{f.razao_social}</p>
          )}
        </div>
        {f.avaliacao != null && f.avaliacao > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className={`h-3 w-3 ${i <= Math.round(Number(f.avaliacao)) ? 'text-amber-400' : 'text-zinc-700'}`} viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10.5l.6-3.2L1.2 5l3.3-.5z"/>
              </svg>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          { label: 'CNPJ',     value: f.cnpj,     mono: true },
          { label: 'Categoria', value: f.categoria },
          { label: 'Contato',  value: f.contato },
          { label: 'Telefone', value: f.telefone },
          { label: 'E-mail',   value: f.email,    wide: true },
          { label: 'Cidade',   value: f.cidade ? `${f.cidade}${f.estado ? `/${f.estado}` : ''}` : undefined },
        ].filter(r => r.value).map(({ label, value, mono, wide }) => (
          <div key={label} className={wide ? 'col-span-2' : ''}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
            <p className={`mt-0.5 text-[11px] text-zinc-400 ${mono ? 'font-mono' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {f.observacoes && (
        <div className="mt-3 border-t border-zinc-800/60 pt-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Observações</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">{f.observacoes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export function NovaCotacaoModal({ aberto, solicitacao, onFechar, onCriada }: Props) {
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [fornecedorSel, setFornecedorSel] = useState<Fornecedor | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [salvando, setSalvando] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  // Carrega fornecedores do banco ao abrir
  useEffect(() => {
    if (!aberto) return
    setCarregando(true)
    setErroCarregamento(null)
    getFornecedores()
      .then((lista) => {
        setFornecedores(lista)
        if (lista.length === 0) setErroCarregamento('Nenhum fornecedor cadastrado. Cadastre um fornecedor primeiro.')
      })
      .catch((err) => {
        console.error('[NovaCotacao] Erro ao carregar fornecedores:', err)
        setErroCarregamento(`Erro ao carregar: ${err?.message ?? 'verifique o console'}`)
      })
      .finally(() => setCarregando(false))
  }, [aberto])

  // Esc fecha
  useEffect(() => {
    if (!aberto) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [aberto, onFechar])

  // Reseta ao fechar
  useEffect(() => {
    if (!aberto) {
      setCampos(VAZIO)
      setFornecedorSel(null)
      setErros({})
      setErroGeral(null)
    }
  }, [aberto])

  function set<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: '' }))
  }

  // Seleciona fornecedor → preenche campos automaticamente
  function handleSelecionarFornecedor(f: Fornecedor | null) {
    setFornecedorSel(f)
    if (!f) {
      setCampos(prev => ({ ...prev, fornecedor_id: '', fornecedor: '', cnpj: '', contato: '', email: '', telefone: '' }))
      return
    }
    setCampos(prev => ({
      ...prev,
      fornecedor_id: f.id,
      fornecedor: f.nome,
      cnpj: f.cnpj ?? '',
      contato: f.contato ?? '',
      email: f.email ?? '',
      telefone: f.telefone ?? '',
    }))
    setErros(prev => ({ ...prev, fornecedor: '' }))
  }

  function validar() {
    const e: Partial<Record<keyof Campos, string>> = {}
    if (!campos.fornecedor) e.fornecedor = 'Selecione um fornecedor'
    if (!campos.valor || Number(campos.valor) <= 0) e.valor = 'Informe o valor'
    if (!campos.prazo_dias || Number(campos.prazo_dias) <= 0) e.prazo_dias = 'Informe o prazo'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function handleSalvar() {
    if (!validar() || !solicitacao) return
    setSalvando(true)
    setErroGeral(null)
    try {
      const nova = await createCotacao({
        solicitacao_id: solicitacao.id,
        fornecedor_id: campos.fornecedor_id || undefined,
        fornecedor: campos.fornecedor,
        cnpj: campos.cnpj,
        contato: campos.contato || undefined,
        email: campos.email || undefined,
        telefone: campos.telefone || undefined,
        valor: Number(campos.valor),
        prazo_dias: Number(campos.prazo_dias),
        validade_dias: Number(campos.validade_dias) || 30,
        condicoes: campos.condicoes,
        forma_pagamento: campos.forma_pagamento,
        frete_incluso: campos.frete_incluso,
        selecionada: false,
      })
      onCriada(nova)
      onFechar()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setErroGeral(`Erro ao salvar: ${msg}`)
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto || !solicitacao) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div className="relative flex w-full max-w-xl flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-100">Adicionar Cotação</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {solicitacao.descricao} · {solicitacao.quantidade} {solicitacao.unidade}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          <div className="space-y-5">

            {/* ── Fornecedor ── */}
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
                Fornecedor
              </p>
              <div className="space-y-3">
                <div>
                  <Label text="Buscar fornecedor" required />
                  <AutocompleteFornecedor
                    fornecedores={fornecedores}
                    carregando={carregando}
                    erroCarregamento={erroCarregamento}
                    fornecedorSelecionado={fornecedorSel}
                    onSelecionar={handleSelecionarFornecedor}
                    erro={erros.fornecedor}
                  />
                </div>

                {/* Card com dados preenchidos automaticamente */}
                {fornecedorSel && <CardFornecedor f={fornecedorSel} />}
              </div>
            </div>

            <div className="border-t border-zinc-800/60" />

            {/* ── Proposta Comercial ── */}
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
                Proposta Comercial
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label text="Valor Total" required />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">R$</span>
                      <input
                        type="number" min="0.01" step="0.01" placeholder="0,00"
                        value={campos.valor}
                        onChange={e => set('valor', e.target.value)}
                        className={`${inputCls} pl-8 ${erros.valor ? 'border-red-500/60' : ''}`}
                      />
                    </div>
                    {erros.valor && <p className="mt-1 text-[10px] text-red-400">{erros.valor}</p>}
                  </div>
                  <div>
                    <Label text="Prazo entrega" required />
                    <div className="relative">
                      <input
                        type="number" min="1" placeholder="0"
                        value={campos.prazo_dias}
                        onChange={e => set('prazo_dias', e.target.value)}
                        className={`${inputCls} pr-10 ${erros.prazo_dias ? 'border-red-500/60' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">dias</span>
                    </div>
                    {erros.prazo_dias && <p className="mt-1 text-[10px] text-red-400">{erros.prazo_dias}</p>}
                  </div>
                  <div>
                    <Label text="Validade" />
                    <div className="relative">
                      <input
                        type="number" min="1"
                        value={campos.validade_dias}
                        onChange={e => set('validade_dias', e.target.value)}
                        className={`${inputCls} pr-10`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">dias</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label text="Forma de pagamento" />
                    <div className="relative">
                      <select
                        value={campos.forma_pagamento}
                        onChange={e => set('forma_pagamento', e.target.value as FormaPagamento)}
                        className={selectCls}
                      >
                        {PAGAMENTOS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 6l4 4 4-4" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => set('frete_incluso', !campos.frete_incluso)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-[12px] font-medium transition-all ${
                        campos.frete_incluso
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className={`relative h-4 w-7 rounded-full transition-colors ${campos.frete_incluso ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${campos.frete_incluso ? 'translate-x-3.5' : 'translate-x-0.5'}`}/>
                      </div>
                      Frete incluso
                    </button>
                  </div>
                </div>

                <div>
                  <Label text="Condições / Observações" />
                  <textarea
                    rows={2}
                    placeholder="Ex: 5% de desconto para pagamento antecipado, mínimo 10 unidades..."
                    value={campos.condicoes}
                    onChange={e => set('condicoes', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Erro geral */}
            {erroGeral && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-400">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5zm0 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
                </svg>
                {erroGeral}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <p className="text-[10px] text-zinc-600">
            Campos com <span className="text-red-400">*</span> são obrigatórios
          </p>
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              disabled={salvando}
              className="rounded-lg border border-zinc-700/60 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando || !campos.fornecedor}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="6" strokeOpacity="0.3"/>
                    <path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar Cotação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
