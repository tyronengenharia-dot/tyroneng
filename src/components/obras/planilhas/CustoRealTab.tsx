'use client'

import { useEffect, useState, useCallback } from 'react'
import { PlanilhaTab } from './PlanilhaTab'
import { PagamentosModal } from './PagamentosModal'
import {
  getPagamentosByObra,
  mapaPagamentosPorItem,
  type PagamentoResumo,
} from '@/services/custoRealPagamentoService'
import { getPlanilhasStatus, planilhaEditavel } from '@/services/planilhaEstadoService'
import { getContas } from '@/services/bancoService'
import { PlanilhaItem } from '@/types'
import { ContaComSaldo } from '@/types/banco'
import { fmtCurrency } from '@/lib/utils'

const itemTotal = (it: PlanilhaItem) =>
  (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0)

// Custo Real = onde o gasto é registrado. Cada item ganha uma coluna "Pago /
// Total" com os pagamentos (parcelas) e um modal pra gerenciá-los. As saídas do
// Financeiro saem daqui — ver custoRealPagamentoService + 0006.
export function CustoRealTab({ obra_id }: { obra_id: string }) {
  const [pagMap, setPagMap] = useState<Record<string, PagamentoResumo>>({})
  const [editavel, setEditavel] = useState(true)
  const [contas, setContas] = useState<ContaComSaldo[]>([])
  const [modalItem, setModalItem] = useState<PlanilhaItem | null>(null)

  const reloadPagamentos = useCallback(async () => {
    const list = await getPagamentosByObra(obra_id)
    setPagMap(mapaPagamentosPorItem(list))
  }, [obra_id])

  useEffect(() => {
    let active = true
    Promise.all([
      getPagamentosByObra(obra_id),
      getPlanilhasStatus(obra_id),
      getContas(),
    ]).then(([list, headers, contasList]) => {
      if (!active) return
      setPagMap(mapaPagamentosPorItem(list))
      const h = headers.find(x => x.tipo === 'custo_real')
      setEditavel(h ? planilhaEditavel('custo_real', h.status) : true)
      setContas(contasList)
    })
    return () => { active = false }
  }, [obra_id])

  const somaPago = (itens: PlanilhaItem[]) =>
    itens.reduce((s, it) => s + (pagMap[it.id]?.pago ?? 0), 0)

  return (
    <>
      <PlanilhaTab
        obra_id={obra_id}
        tipo="custo_real"
        title="Custo Real"
        subtitle="Valores efetivamente gastos — registre os pagamentos de cada item"
        extraHeaders={['Pago / Total']}
        extraCells={item => {
          const r = pagMap[item.id]
          const pago = r?.pago ?? 0
          const somaParcelas = r?.total ?? 0
          const tot = itemTotal(item)
          const mismatch = somaParcelas > 0 && Math.abs(somaParcelas - tot) > 0.005
          return (
            <td className="px-3 py-1.5 text-right w-44">
              <button
                onClick={() => setModalItem(item)}
                title="Gerenciar pagamentos"
                className="inline-flex items-center gap-1.5 font-mono text-sm rounded px-1.5 py-0.5 hover:bg-white/5 transition-colors"
              >
                <span className={pago > 0 ? 'text-green-400' : 'text-white/30'}>{fmtCurrency(pago)}</span>
                <span className="text-white/25">/ {fmtCurrency(tot)}</span>
                {mismatch && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    title="Soma das parcelas ≠ total do item"
                  />
                )}
              </button>
            </td>
          )
        }}
        extraCatCells={itens => (
          <span className="text-white/30 text-xs font-mono whitespace-nowrap">
            pago {fmtCurrency(somaPago(itens))}
          </span>
        )}
        extraTotalCells={allItems => (
          <td className="px-3 py-3 text-right font-mono font-semibold text-green-400">
            {fmtCurrency(somaPago(allItems))}
          </td>
        )}
      />

      {modalItem && (
        <PagamentosModal
          item={modalItem}
          obra_id={obra_id}
          editavel={editavel}
          contas={contas}
          onClose={() => setModalItem(null)}
          onChanged={reloadPagamentos}
        />
      )}
    </>
  )
}
