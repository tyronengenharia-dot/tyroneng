'use client'

import { useState, useEffect, useRef } from 'react'
import type { SolicitacaoCompra, UrgenciaSolicitacao } from '@/types/compras'
import { createSolicitacao } from '@/services/comprasService'

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
    }
  }, [aberto])

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
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    setErroGeral(null)
    try {
      const nova = await createSolicitacao({
        descricao: campos.descricao.trim(),
        categoria: campos.categoria,
        quantidade: Number(campos.quantidade),
        unidade: campos.unidade,
        urgencia: campos.urgencia,
        data_necessaria: campos.data_necessaria,
        solicitante: campos.solicitante.trim(),
        observacoes: campos.observacoes.trim() || undefined,
        obra_id: campos.obra_id || 'default',
        status: 'pendente',
      })
      onCriada(nova)
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
