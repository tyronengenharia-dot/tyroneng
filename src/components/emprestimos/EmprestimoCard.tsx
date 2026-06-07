'use client'

import { Pencil, Trash2, ArrowUpRight, AlertTriangle, CalendarClock, Shield, Percent } from 'lucide-react'
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
  const temEncargos = e.encargos_atraso > 0.005

  const taxaTxt =
    e.categoria === 'consorcio'
      ? e.taxa_admin_pct
        ? `Tx. adm ${e.taxa_admin_pct}%`
        : null
      : e.regime === 'sem_juros'
        ? 'Sem juros'
        : e.taxa_juros_mensal > 0
          ? `${e.taxa_juros_mensal}% a.m.`
          : null

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

      {/* chips: taxa + garantias */}
      {(taxaTxt || e.qtd_garantias > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 -mt-1">
          {taxaTxt && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">
              <Percent size={9} /> {taxaTxt}
            </span>
          )}
          {e.qtd_garantias > 0 && (
            <span
              title={`${e.qtd_garantias} garantia(s)${e.garantias_valor > 0 ? ` · ${fmtCurrency(e.garantias_valor)} estimado` : ''}${
                e.garantias_alienadas > 0 ? ` · ${e.garantias_alienadas} alienada(s)` : ''
              }`}
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${
                e.garantias_alienadas > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-white/50 border-white/10'
              }`}
            >
              <Shield size={9} />
              {e.garantias_alienadas > 0
                ? `${e.garantias_alienadas} alienada${e.garantias_alienadas > 1 ? 's' : ''}`
                : `${e.qtd_garantias} garantia${e.qtd_garantias > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      )}

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
            {temEncargos && (
              <span className="text-red-400/60">+{fmtCurrency(e.encargos_atraso)} enc.</span>
            )}
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
