'use client'

import { useState, useEffect, useRef } from 'react'
import type { SolicitacaoCompra, UrgenciaSolicitacao, DestinoEntrega } from '@/types/compras'
import type { Insumo } from '@/types/insumo'
import type { Obra, PlanilhaItem } from '@/types'
import { createSolicitacao } from '@/services/comprasService'
import { getInsumos } from '@/services/insumoService'
import { getObras } from '@/services/obraService'
import { getItensByObra } from '@/services/planilhaService'

interface Props {
  aberto: boolean
  onFechar: () => void
  onCriada: (nova: SolicitacaoCompra) => void
}

const CATEGORIAS = [
  'Estrutura',
  'Acabamento',
  'Elétrica',
  'Hidráulica',
  'Impermeabilização',
  'Esquadrias',
  'Revestimento',
  'Fundação',
  'Cobertura',
  'Outros',
]

const UNIDADES = ['un', 'kg', 'm', 'm²', 'm³', 'sc', 'rl', 'cx', 'l', 'tb']

const URGENCIAS: { value: UrgenciaSolicitacao; label: string; desc: string; cor: string }[] = [
  { value: 'baixa',   label: 'Baixa',   desc: 'Sem pressa',       cor: 'border-zinc-600 data-[sel=true]:border-zinc-400 data-[sel=true]:bg-zinc-700/40' },
  { value: 'media',   label: 'Média',   desc: 'Precisa em breve', cor: 'border-zinc-700 data-[sel=true]:border-teal-500 data-[sel=true]:bg-teal-500/10' },
  { value: 'alta',    label: 'Alta',    desc: 'Urgente',          cor: 'border-zinc-700 data-[sel=true]:border-amber-500 data-[sel=true]:bg-amber-500/10' },
  { value: 'critica', label: 'Crítica', desc: 'Parar obra',       cor: 'border-zinc-700 data-[sel=true]:border-red-500 data-[sel=true]:bg-red-500/10' },
]

const URGENCIA_DOT: Record<UrgenciaSolicitacao, string> = {
  baixa:   'bg-zinc-500',
  media:   'bg-teal-500',
  alta:    'bg-amber-500',
  critica: 'bg-red-500',
}

type Campos = {
  descricao: string
  categoria: string
  quantidade: string
  unidade: string
  urgencia: UrgenciaSolicitacao
  data_necessaria: string
  solicitante: string
  observacoes: string
  obra_id: string
  insumo_id: string
  entrega_tipo: DestinoEntrega
  entrega_obra_id: string
  planilha_item_id: string
}

const VAZIO: Campos = {
  descricao: '',
  categoria: '',
  quantidade: '',
  unidade: 'un',
  urgencia: 'media',
  data_necessaria: '',
  solicitante: '',
  observacoes: '',
  obra_id: '',
  insumo_id: '',
  entrega_tipo: 'deposito',
  entrega_obra_id: '',
  planilha_item_id: '',
}

function InputField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'

const selectCls =
  'w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-200 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none cursor-pointer'

export function NovaSolicitacaoModal({ aberto, onFechar, onCriada }: Props) {
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [erros, setErros] = useState<Partial<Campos>>({})
  const [salvando, setSalvando] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const primeiroInput = useRef<HTMLInputElement>(null)

  // Catálogo de insumos (origem opcional do item solicitado)
  const [catalogo, setCatalogo] = useState<Insumo[]>([])
  const [insumoSel, setInsumoSel] = useState<Insumo | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [buscaInsumo, setBuscaInsumo] = useState('')

  // Obras (origem + destino) e itens de Custo Real da obra de destino
  const [obras, setObras] = useState<Obra[]>([])
  const [itensObra, setItensObra] = useState<PlanilhaItem[]>([])
  const [loadingItens, setLoadingItens] = useState(false)

  // Fecha com Esc
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [aberto, onFechar])

  // Foca no primeiro campo ao abrir
  useEffect(() => {
    if (aberto) {
      setTimeout(() => primeiroInput.current?.focus(), 50)
    } else {
      setCampos(VAZIO)
      setErros({})
      setErroGeral(null)
      setInsumoSel(null)
      setShowPicker(false)
      setBuscaInsumo('')
      setItensObra([])
    }
  }, [aberto])

  // Carrega o catálogo de insumos ativos e a lista de obras ao abrir
  useEffect(() => {
    if (!aberto) return
    let active = true
    getInsumos().then((rows) => {
      if (active) setCatalogo(rows.filter((i) => i.ativo))
    })
    getObras().then((rows) => {
      if (active) setObras(rows)
    })
    return () => { active = false }
  }, [aberto])

  // Carrega os itens de Custo Real da obra de destino (para escolher onde lançar
  // o gasto). Só quando o destino é uma obra específica.
  useEffect(() => {
    if (!aberto) return
    if (campos.entrega_tipo !== 'obra' || !campos.entrega_obra_id) {
      setItensObra([])
      return
    }
    let active = true
    setLoadingItens(true)
    getItensByObra(campos.entrega_obra_id, 'custo_real')
      .then((rows) => { if (active) setItensObra(rows) })
      .catch(() => { if (active) setItensObra([]) })
      .finally(() => { if (active) setLoadingItens(false) })
    return () => { active = false }
  }, [aberto, campos.entrega_tipo, campos.entrega_obra_id])

  // Vincula um insumo do catálogo: preenche descrição e trava a unidade.
  function selecionarInsumo(ins: Insumo) {
    setInsumoSel(ins)
    setCampos((prev) => ({
      ...prev,
      insumo_id: ins.id,
      descricao: ins.descricao,
      unidade: ins.unidade,
    }))
    setErros((prev) => ({ ...prev, descricao: '' }))
    setShowPicker(false)
    setBuscaInsumo('')
  }

  // Desvincula: volta ao modo item avulso (texto livre / unidade editável).
  function limparInsumo() {
    setInsumoSel(null)
    setCampos((prev) => ({
      ...prev,
      insumo_id: '',
      unidade: UNIDADES.includes(prev.unidade) ? prev.unidade : 'un',
    }))
  }

  const catalogoFiltrado = catalogo.filter((i) => {
    const q = buscaInsumo.toLowerCase()
    return i.codigo.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q)
  })

  // Alterna o destino. Ao escolher "obra", já sugere a obra solicitante (origem).
  function setDestino(tipo: DestinoEntrega) {
    setCampos((prev) => ({
      ...prev,
      entrega_tipo: tipo,
      entrega_obra_id:
        tipo === 'obra' && !prev.entrega_obra_id ? prev.obra_id : prev.entrega_obra_id,
      planilha_item_id: tipo === 'obra' ? prev.planilha_item_id : '',
    }))
    setErros((prev) => ({ ...prev, entrega_obra_id: '', planilha_item_id: '' }))
  }

  // Troca a obra de destino: zera o item escolhido (era de outra obra).
  function setObraDestino(obraId: string) {
    setCampos((prev) => ({ ...prev, entrega_obra_id: obraId, planilha_item_id: '' }))
    setErros((prev) => ({ ...prev, entrega_obra_id: '', planilha_item_id: '' }))
  }

  function set(campo: keyof Campos, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  function validar(): boolean {
    const novosErros: Partial<Campos> = {}
    if (!campos.descricao.trim()) novosErros.descricao = 'Informe o material ou serviço'
    if (!campos.categoria) novosErros.categoria = 'Selecione uma categoria'
    if (!campos.quantidade || Number(campos.quantidade) <= 0) novosErros.quantidade = 'Quantidade inválida'
    if (!campos.data_necessaria) novosErros.data_necessaria = 'Informe a data necessária'
    if (!campos.solicitante.trim()) novosErros.solicitante = 'Informe o solicitante'
    if (campos.entrega_tipo === 'obra') {
      if (!campos.entrega_obra_id) novosErros.entrega_obra_id = 'Selecione a obra de destino'
      if (!campos.planilha_item_id) novosErros.planilha_item_id = 'Selecione o item de Custo Real'
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    setErroGeral(null)
    try {
      const ehObra = campos.entrega_tipo === 'obra'
      const nova = await createSolicitacao({
        descricao: campos.descricao.trim(),
        categoria: campos.categoria,
        quantidade: Number(campos.quantidade),
        unidade: campos.unidade,
        urgencia: campos.urgencia,
        data_necessaria: campos.data_necessaria,
        solicitante: campos.solicitante.trim(),
        observacoes: campos.observacoes.trim() || undefined,
        obra_id: campos.obra_id || undefined,
        insumo_id: campos.insumo_id || undefined,
        entrega_tipo: campos.entrega_tipo,
        entrega_obra_id: ehObra ? campos.entrega_obra_id || undefined : undefined,
        planilha_item_id: ehObra ? campos.planilha_item_id || undefined : undefined,
        status: 'pendente',
      })
      // Enriquece com nomes p/ exibição imediata (o insert não devolve os joins).
      onCriada({
        ...nova,
        obra_nome: obras.find((o) => o.id === campos.obra_id)?.name,
        entrega_obra_nome: ehObra
          ? obras.find((o) => o.id === campos.entrega_obra_id)?.name
          : undefined,
        planilha_item_descricao: ehObra
          ? itensObra.find((i) => i.id === campos.planilha_item_id)?.descricao
          : undefined,
      })
      onFechar()
    } catch (err) {
      console.error(err)
      setErroGeral('Erro ao salvar. Verifique a conexão com o banco.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) return null

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}
    >
      {/* Painel */}
      <div className="relative flex w-full max-w-lg flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-100">Nova Solicitação</h2>
            <p className="text-[11px] text-zinc-500">Preencha os dados do material ou serviço</p>
          </div>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {/* Catálogo de insumos */}
            <InputField label="Buscar no catálogo de insumos">
              {insumoSel ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-zinc-100">
                      <span className="font-mono text-indigo-300">{insumoSel.codigo}</span> · {insumoSel.descricao}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Unidade {insumoSel.unidade} · ref. R$ {insumoSel.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={limparInsumo}
                    className="shrink-0 rounded-md border border-zinc-600/60 px-2 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPicker((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border border-dashed border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-[12px] text-zinc-400 transition-colors hover:border-indigo-500/50 hover:text-zinc-300"
                  >
                    <span>Vincular item do catálogo (opcional)</span>
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" strokeLinecap="round"/></svg>
                  </button>
                  {showPicker && (
                    <div className="mt-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 p-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar por código ou descrição..."
                        value={buscaInsumo}
                        onChange={(e) => setBuscaInsumo(e.target.value)}
                        className={inputCls}
                      />
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {catalogoFiltrado.length === 0 ? (
                          <p className="py-3 text-center text-[11px] text-zinc-600">
                            {catalogo.length === 0 ? 'Nenhum insumo ativo no catálogo.' : 'Nenhum insumo para este filtro.'}
                          </p>
                        ) : (
                          catalogoFiltrado.slice(0, 50).map((ins) => (
                            <button
                              key={ins.id}
                              type="button"
                              onClick={() => selecionarInsumo(ins)}
                              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-700/50"
                            >
                              <span className="truncate text-[12px] text-zinc-300">
                                <span className="font-mono text-zinc-500">{ins.codigo}</span> {ins.descricao}
                              </span>
                              <span className="shrink-0 text-[10px] text-zinc-500">
                                {ins.unidade} · R$ {ins.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </InputField>

            {/* Obra solicitante (origem) */}
            <InputField label="Obra solicitante (origem)">
              <div className="relative">
                <select
                  value={campos.obra_id}
                  onChange={(e) => set('obra_id', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Geral / Empresa (sem obra)</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              </div>
            </InputField>

            {/* Destino da entrega */}
            <InputField label="Destino da entrega" required>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-sel={campos.entrega_tipo === 'deposito'}
                  onClick={() => setDestino('deposito')}
                  className="rounded-lg border border-zinc-700 px-3 py-2.5 text-left transition-all data-[sel=true]:border-indigo-500 data-[sel=true]:bg-indigo-500/10"
                >
                  <span className="block text-[12px] font-medium text-zinc-200">Depósito (empresa)</span>
                  <span className="text-[9px] text-zinc-500">Entra no estoque central</span>
                </button>
                <button
                  type="button"
                  data-sel={campos.entrega_tipo === 'obra'}
                  onClick={() => setDestino('obra')}
                  className="rounded-lg border border-zinc-700 px-3 py-2.5 text-left transition-all data-[sel=true]:border-indigo-500 data-[sel=true]:bg-indigo-500/10"
                >
                  <span className="block text-[12px] font-medium text-zinc-200">Obra específica</span>
                  <span className="text-[9px] text-zinc-500">Vira custo da obra</span>
                </button>
              </div>
            </InputField>

            {/* Detalhes do destino = obra */}
            {campos.entrega_tipo === 'obra' && (
              <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                <InputField label="Obra de destino" required error={erros.entrega_obra_id}>
                  <div className="relative">
                    <select
                      value={campos.entrega_obra_id}
                      onChange={(e) => setObraDestino(e.target.value)}
                      className={`${selectCls} ${erros.entrega_obra_id ? 'border-red-500/60' : ''}`}
                    >
                      <option value="">Selecionar obra...</option>
                      {obras.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                  </div>
                </InputField>

                <InputField label="Item do Custo Real (onde lançar o gasto)" required error={erros.planilha_item_id}>
                  {!campos.entrega_obra_id ? (
                    <p className="text-[11px] text-zinc-600">Selecione a obra de destino primeiro.</p>
                  ) : loadingItens ? (
                    <p className="text-[11px] text-zinc-500">Carregando itens...</p>
                  ) : itensObra.length === 0 ? (
                    <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
                      Esta obra não tem itens de Custo Real. Libere/cadastre o Custo Real da obra para poder lançar o gasto.
                    </p>
                  ) : (
                    <div className="relative">
                      <select
                        value={campos.planilha_item_id}
                        onChange={(e) => set('planilha_item_id', e.target.value)}
                        className={`${selectCls} ${erros.planilha_item_id ? 'border-red-500/60' : ''}`}
                      >
                        <option value="">Selecionar item...</option>
                        {itensObra.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.codigo ? `${it.codigo} · ` : ''}{it.descricao}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                    </div>
                  )}
                </InputField>
              </div>
            )}

            {/* Descrição */}
            <InputField label="Material / Serviço" required error={erros.descricao}>
              <input
                ref={primeiroInput}
                type="text"
                placeholder="Ex: Cimento CP-II 50kg, Vergalhão CA-50 12mm..."
                value={campos.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                className={`${inputCls} ${erros.descricao ? 'border-red-500/60' : ''}`}
              />
            </InputField>

            {/* Categoria + Qtd + Unidade */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <InputField label="Categoria" required error={erros.categoria}>
                  <div className="relative">
                    <select
                      value={campos.categoria}
                      onChange={(e) => set('categoria', e.target.value)}
                      className={`${selectCls} ${erros.categoria ? 'border-red-500/60' : ''}`}
                    >
                      <option value="">Selecionar...</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                  </div>
                </InputField>
              </div>
              <div>
                <InputField label="Quantidade" required error={erros.quantidade}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    value={campos.quantidade}
                    onChange={(e) => set('quantidade', e.target.value)}
                    className={`${inputCls} ${erros.quantidade ? 'border-red-500/60' : ''}`}
                  />
                </InputField>
              </div>
              <div>
                <InputField label="Unidade">
                  {insumoSel ? (
                    <input
                      type="text"
                      value={campos.unidade}
                      readOnly
                      title="Unidade definida pelo insumo do catálogo"
                      className={`${inputCls} cursor-not-allowed opacity-70`}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={campos.unidade}
                        onChange={(e) => set('unidade', e.target.value)}
                        className={selectCls}
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                    </div>
                  )}
                </InputField>
              </div>
            </div>

            {/* Urgência */}
            <InputField label="Urgência" required>
              <div className="grid grid-cols-4 gap-2">
                {URGENCIAS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    data-sel={campos.urgencia === u.value}
                    onClick={() => set('urgencia', u.value)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-all ${u.cor}`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${URGENCIA_DOT[u.value]}`} />
                      <span className="text-[11px] font-medium text-zinc-200">{u.label}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500">{u.desc}</span>
                  </button>
                ))}
              </div>
            </InputField>

            {/* Data + Solicitante */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Necessário até" required error={erros.data_necessaria}>
                <input
                  type="date"
                  value={campos.data_necessaria}
                  onChange={(e) => set('data_necessaria', e.target.value)}
                  className={`${inputCls} ${erros.data_necessaria ? 'border-red-500/60' : ''} [color-scheme:dark]`}
                />
              </InputField>
              <InputField label="Solicitante" required error={erros.solicitante}>
                <input
                  type="text"
                  placeholder="Nome do responsável"
                  value={campos.solicitante}
                  onChange={(e) => set('solicitante', e.target.value)}
                  className={`${inputCls} ${erros.solicitante ? 'border-red-500/60' : ''}`}
                />
              </InputField>
            </div>

            {/* Observações */}
            <InputField label="Observações">
              <textarea
                rows={2}
                placeholder="Especificações técnicas, referências, detalhes adicionais..."
                value={campos.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </InputField>

            {/* Erro geral */}
            {erroGeral && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-400">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5zm0 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
                {erroGeral}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onFechar}
            disabled={salvando}
            className="rounded-lg border border-zinc-700/60 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {salvando ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
                  <path d="M8 2a6 6 0 016 6" strokeLinecap="round" />
                </svg>
                Salvando...
              </>
            ) : (
              'Criar Solicitação'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
