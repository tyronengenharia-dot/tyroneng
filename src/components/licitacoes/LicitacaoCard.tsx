import { Licitacao } from '@/types/licitacao'
import { STATUS_CONFIG, calcProgress, fmtMoney, fmtDate, daysUntil } from '@/lib/licitacaoUtils'

interface Props {
  lic: Licitacao
  onClick: () => void
}

export function LicitacaoCard({ lic, onClick }: Props) {
  const sc = STATUS_CONFIG[lic.status]
  const pct = calcProgress(lic.checklist)
  const days = daysUntil(lic.dataEntrega)
  const pending = lic.checklist.filter(i => i.status === 'pendente').length

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-blue-500/40 rounded-xl p-5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-2">
          {lic.titulo}
        </h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${sc.bg} ${sc.color} border ${sc.border}`}>
          {sc.label}
        </span>
      </div>

      <p className="text-xs text-zinc-500 truncate mb-4">{lic.orgao}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Prontidão</span>
          <span className="text-zinc-400 font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full">
          <div
            className="h-1.5 bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Entrega</p>
          <p className={`text-xs font-medium mt-0.5 ${days !== null && days < 3 ? 'text-red-400' : 'text-zinc-400'}`}>
            {fmtDate(lic.dataEntrega)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Valor</p>
          <p className="text-xs font-medium text-green-400 mt-0.5">{fmtMoney(lic.valorEstimado)}</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            <span className="text-[10px] text-red-400 font-medium">{pending} pendente{pending > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </button>
  )
}
