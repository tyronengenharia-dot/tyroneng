'use client'

import { SolicitacaoCompra } from '@/types/compras'

export function SolicitacaoList({ data }: { data: SolicitacaoCompra[] }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div
          key={item.id}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between"
        >
          <div>
            <p className="font-semibold">{item.descricao}</p>
            <p className="text-sm text-zinc-400">{item.categoria}</p>
          </div>

          <span className="text-xs uppercase">{item.status}</span>
        </div>
      ))}
    </div>
  )
}