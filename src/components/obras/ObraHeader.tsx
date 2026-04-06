import { Obra } from '@/types'
import { Badge, KpiCard } from '@/components/ui'
import { fmtCurrency, fmtDateShort } from '@/lib/utils'
import Link from 'next/link'

type Props = {
  obra: Obra
  custoReal?: number
  custoPlano?: number
  progressoFisico?: number
}

export function ObraHeader({ obra, custoReal = 0, custoPlano = 0, progressoFisico = 0 }: Props) {
  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 mb-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge value={obra.status} />
            <span className="text-xs text-white/20 font-mono">#{obra.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white leading-tight">
            {obra.name}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-white/40">
            <span>{obra.client}</span>
            <span className="text-white/10">·</span>
            <span>{obra.location}</span>
            <span className="text-white/10">·</span>
            <span>Início {fmtDateShort(obra.start_date)}</span>
            {obra.end_date && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-amber-400">Prazo {fmtDateShort(obra.end_date)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href={`/obras/${obra.id}/editar`}
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
          >
            Editar
          </Link>
          <button className="px-4 py-2 text-sm font-medium bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            Relatório PDF
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 pt-5 border-t border-white/[0.06]">
        <div>
          <p className="text-[11px] text-white/30 font-medium mb-1">Orçamento Venda</p>
          <p className="text-base font-semibold font-mono text-white">{fmtCurrency(obra.budget)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/30 font-medium mb-1">Custo Planejado</p>
          <p className="text-base font-semibold font-mono text-amber-400">{fmtCurrency(custoPlano)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/30 font-medium mb-1">Custo Real</p>
          <p className="text-base font-semibold font-mono text-blue-400">{fmtCurrency(custoReal)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/30 font-medium mb-1">Progresso Físico</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-green-400">{progressoFisico}%</p>
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${progressoFisico}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
