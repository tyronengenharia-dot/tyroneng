import { Licitacao } from '@/types/licitacao'
import { calcProgress, fmtMoney, fmtDate, daysUntil } from '@/lib/licitacaoUtils'

interface Props {
  lic: Licitacao
}

export function LicitacaoMetrics({ lic }: Props) {
  const pct = calcProgress(lic.checklist)
  const done = lic.checklist.filter(i => i.status === 'concluido').length
  const pending = lic.checklist.filter(i => i.status === 'pendente').length
  const days = daysUntil(lic.dataEntrega)

  const daysLabel = days === null
    ? 'Não definido'
    : days >= 0
      ? `Em ${days} dia${days !== 1 ? 's' : ''}`
      : `Venceu há ${Math.abs(days)} dias`

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Valor estimado</p>
        <p className="text-xl font-semibold text-green-400">{fmtMoney(lic.valorEstimado)}</p>
        <p className="text-xs text-zinc-600 mt-1">Contrato previsto</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Prazo de entrega</p>
        <p className="text-xl font-semibold text-amber-400">{fmtDate(lic.dataEntrega)}</p>
        <p className={`text-xs mt-1 ${days !== null && days < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
          {daysLabel}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Prontidão</p>
        <p className="text-xl font-semibold text-blue-400">{pct}%</p>
        <p className="text-xs text-zinc-600 mt-1">{done} de {lic.checklist.length} itens</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Itens pendentes</p>
        <p className={`text-xl font-semibold ${pending === 0 ? 'text-green-400' : 'text-red-400'}`}>
          {pending}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          {pending === 0 ? 'Tudo em ordem!' : 'Atenção necessária'}
        </p>
      </div>
    </div>
  )
}
