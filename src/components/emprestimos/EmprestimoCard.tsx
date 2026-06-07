'use client'

import { Pencil, Trash2, ArrowUpRight, AlertTriangle, CalendarClock } from 'lucide-react'
import { ProgressBar } from '@/components/ui'
import { EmprestimoResumo } from '@/types/emprestimo'
import { categoriaLabels, statusClass, statusLabels } from '@/lib/emprestimoConstants'
import { fmtCurrency, fmtDate } from '@/lib/utils'

interface Props {
  emprestimo: EmprestimoResumo
  obraNome?: string
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export function EmprestimoCard({ emprestimo: e, obraNome, onOpen, onEdit, onDelete }: Props) {
  const progresso =
    e.total_contratado > 0 ? Math.min(100, (e.total_pago / e.total_contratado) * 100) : 0
  const temAtraso = e.valor_em_atraso > 0.005

  return (
    <div className="group relative bg-[#111] border border-white/[0.08] rounded-2xl p-5 overflow-hidden hover:border-white/20 transition-colors">
      <span className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: e.cor }} />

      {/* topo */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <button onClick={onOpen} className="min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white/5 text-white/50 uppercase tracking-wider">
              {categoriaLabels[e.categoria]}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusClass[e.status]}`}
            >
              {statusLabels[e.status]}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate group-hover:underline">
            {e.descricao}
          </h3>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">
            {e.credor || '—'}
            {obraNome ? ` · 🏗 ${obraNome}` : ''}
          </p>
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* saldo devedor */}
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
        Saldo devedor
      </p>
      <p
        className={`text-2xl font-semibold tracking-tight tabular-nums ${
          e.saldo_devedor > 0.005 ? 'text-white' : 'text-green-400'
        }`}
      >
        {fmtCurrency(Math.max(0, e.saldo_devedor))}
      </p>
      <p className="text-[11px] text-white/40 mt-0.5">
        de {fmtCurrency(e.valor_principal)} {e.categoria === 'consorcio' ? '(carta)' : 'emprestado'}
      </p>

      {/* progresso */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-white/40">
            {e.qtd_pagas}/{e.qtd_parcelas} parcelas
          </span>
          <span className="text-white/60 tabular-nums">{progresso.toFixed(0)}%</span>
        </div>
        <ProgressBar value={progresso} color={temAtraso ? 'amber' : 'green'} />
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
        {temAtraso ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400">
            <AlertTriangle size={12} />
            {fmtCurrency(e.valor_em_atraso)} em atraso
          </span>
        ) : e.proxima_parcela ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
            <CalendarClock size={12} />
            Próxima: {fmtDate(e.proxima_parcela)}
          </span>
        ) : (
          <span className="text-[11px] text-green-400">Quitado</span>
        )}
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
        >
          Detalhes <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  )
}
