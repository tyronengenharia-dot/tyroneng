'use client'

import { useState, useMemo } from 'react'
import type { SolicitacaoCompra, StatusSolicitacao } from '@/types/compras'
import { BadgeStatus, BadgeUrgencia } from './ComprasBadges'
import { formatarData } from '@/lib/formatters'
import { deleteSolicitacao } from '@/services/comprasService'

interface Props {
  data: SolicitacaoCompra[]
  onCotar?: (solicitacao: SolicitacaoCompra) => void
  onVerDetalhes?: (item: SolicitacaoCompra) => void
  onNovaSolicitacao?: () => void
  onExcluida?: (id: string) => void
}

const FILTROS_STATUS: { label: string; value: StatusSolicitacao | 'todas' | 'ativas' }[] = [
  { label: 'Ativas',     value: 'ativas' },
  { label: 'Todas',      value: 'todas' },
  { label: 'Pendentes',  value: 'pendente' },
  { label: 'Em Cotação', value: 'em_cotacao' },
  { label: 'Aprovadas',  value: 'aprovada' },
  { label: 'Recusadas',  value: 'recusada' },
]

// ─── Modal de Detalhes ───────────────────────────────────────────────────────

function ModalDetalhes({
  solicitacao,
  onFechar,
  onExcluir,
  onCotar,
}: {
  solicitacao: SolicitacaoCompra
  onFechar: () => void
  onExcluir: (id: string) => void
  onCotar?: (s: SolicitacaoCompra) => void
}) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const podeExcluir = solicitacao.status === 'pendente'
  const podeCotar   = solicitacao.status === 'pendente'

  async function handleExcluir() {
    setExcluindo(true)
    setErro(null)
    try {
      await deleteSolicitacao(solicitacao.id)
      onExcluir(solicitacao.id)
      onFechar()
    } catch (err) {
      setErro('Erro ao excluir. Tente novamente.')
      console.error(err)
    } finally {
      setExcluindo(false)
      setConfirmandoExclusao(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Solicitação
            </p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-zinc-100 leading-snug">
              {solicitacao.descricao}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 space-y-5">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <BadgeStatus status={solicitacao.status} />
            <BadgeUrgencia urgencia={solicitacao.urgencia} />
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Campo label="Categoria"    valor={solicitacao.categoria} />
            <Campo label="Solicitante"  valor={solicitacao.solicitante} />
            <Campo
              label="Quantidade"
              valor={`${solicitacao.quantidade} ${solicitacao.unidade}`}
            />
            <Campo
              label="Data necessária"
              valor={formatarData(solicitacao.data_necessaria)}
            />
            {solicitacao.obra_nome && (
              <Campo label="Obra" valor={solicitacao.obra_nome} span2 />
            )}
          </div>

          {solicitacao.observacoes && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Observações
              </p>
              <p className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-[12px] text-zinc-300 leading-relaxed">
                {solicitacao.observacoes}
              </p>
            </div>
          )}

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-[12px] text-red-400">
              {erro}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">

          {/* Excluir — só para pendentes */}
          <div>
            {podeExcluir && !confirmandoExclusao && (
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
                  <path d="M3 4h10M6 4V2h4v2M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Excluir
              </button>
            )}
            {confirmandoExclusao && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Confirmar exclusão?</span>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                >
                  {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                </button>
                <button
                  onClick={() => setConfirmandoExclusao(false)}
                  className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Ações direita */}
          <div className="flex items-center gap-2">
            <button
              onClick={onFechar}
              className="rounded-lg border border-zinc-700/60 px-3.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              Fechar
            </button>
            {podeCotar && (
              <button
                onClick={() => { onCotar?.(solicitacao); onFechar() }}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Enviar para Cotação
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, valor, span2 }: { label: string; valor: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-0.5 text-[12px] text-zinc-200">{valor}</p>
    </div>
  )
}

// ─── Lista Principal ─────────────────────────────────────────────────────────

export function SolicitacaoList({ data, onCotar, onVerDetalhes, onNovaSolicitacao, onExcluida }: Props) {
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | 'todas' | 'ativas'>('ativas')
  const [busca, setBusca] = useState('')
  const [cotandoId, setCotandoId] = useState<string | null>(null)
  const [modalSolicitacao, setModalSolicitacao] = useState<SolicitacaoCompra | null>(null)

  const filtrados = useMemo(() => {
    return data.filter((s) => {
      let passaStatus: boolean
      if (filtroStatus === 'todas') {
        passaStatus = true
      } else if (filtroStatus === 'ativas') {
        // Ativas = pendente + em_cotacao (aprovadas e recusadas ficam ocultas por padrão)
        passaStatus = s.status === 'pendente' || s.status === 'em_cotacao'
      } else {
        passaStatus = s.status === filtroStatus
      }

      const passaBusca =
        !busca ||
        s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        s.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        s.solicitante.toLowerCase().includes(busca.toLowerCase())

      return passaStatus && passaBusca
    })
  }, [data, filtroStatus, busca])

  const contadores = useMemo(() => ({
    ativas:    data.filter((s) => s.status === 'pendente' || s.status === 'em_cotacao').length,
    todas:     data.length,
    pendente:  data.filter((s) => s.status === 'pendente').length,
    em_cotacao: data.filter((s) => s.status === 'em_cotacao').length,
    aprovada:  data.filter((s) => s.status === 'aprovada').length,
    recusada:  data.filter((s) => s.status === 'recusada').length,
  }), [data])

  async function handleCotar(s: SolicitacaoCompra) {
    setCotandoId(s.id)
    try {
      await onCotar?.(s)
    } finally {
      setCotandoId(null)
    }
  }

  function handleAbrirModal(s: SolicitacaoCompra) {
    setModalSolicitacao(s)
    onVerDetalhes?.(s)
  }

  function handleExcluida(id: string) {
    onExcluida?.(id)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="5" />
              <path d="M10.5 10.5L14 14" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar solicitações..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pl-9 pr-3 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <button
            onClick={onNovaSolicitacao}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <span className="text-base leading-none">+</span>
            Nova Solicitação
          </button>
        </div>

        {/* Filtros chips */}
        <div className="flex flex-wrap gap-1.5">
          {FILTROS_STATUS.map((f) => {
            const count = contadores[f.value]
            const ativo = filtroStatus === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFiltroStatus(f.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  ativo
                    ? 'bg-indigo-600 text-white'
                    : 'border border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 ${ativo ? 'text-indigo-200' : 'text-zinc-600'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  {['#', 'Descrição', 'Categoria', 'Qtd', 'Urgência', 'Necessidade', 'Status', 'Solicitante', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[12px] text-zinc-500">
                      Nenhuma solicitação encontrada
                    </td>
                  </tr>
                ) : (
                  filtrados.map((s, i) => (
                    <tr key={s.id} className="group transition-colors hover:bg-zinc-800/40">
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] font-mono text-zinc-500">
                        #{String(i + 1).padStart(4, '0')}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <p className="truncate text-[12px] font-medium text-zinc-200">{s.descricao}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{s.categoria}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                        {s.quantidade} {s.unidade}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <BadgeUrgencia urgencia={s.urgencia} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                        {formatarData(s.data_necessaria)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <BadgeStatus status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{s.solicitante}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {s.status === 'pendente' && (
                            <button
                              onClick={() => handleCotar(s)}
                              disabled={cotandoId === s.id}
                              className="flex items-center gap-1 rounded-md bg-indigo-600/80 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                            >
                              {cotandoId === s.id ? (
                                <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3" /><path d="M8 2a6 6 0 016 6" strokeLinecap="round" />
                                </svg>
                              ) : null}
                              Cotar
                            </button>
                          )}
                          <button
                            onClick={() => handleAbrirModal(s)}
                            className="rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-right text-[11px] text-zinc-600">
          {filtrados.length} de {data.length} solicitações
        </p>
      </div>

      {/* Modal */}
      {modalSolicitacao && (
        <ModalDetalhes
          solicitacao={modalSolicitacao}
          onFechar={() => setModalSolicitacao(null)}
          onExcluir={handleExcluida}
          onCotar={handleCotar}
        />
      )}
    </>
  )
}
