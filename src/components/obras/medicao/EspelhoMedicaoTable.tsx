'use client'

import React from 'react'
import { ContratoBloco, MedidoPorItem } from '@/services/medicaoService'
import { fmt, fmtCurrency, cn } from '@/lib/utils'

type Props = {
  blocos: ContratoBloco[]
  medido: MedidoPorItem
}

const HEADERS = [
  'Item', 'Código', 'Descrição', 'Un.',
  'Qtd Contr.', 'Vlr Unit.', 'Total Contr.',
  'Qtd Medida', 'Medido (R$)', '% Med.', 'Saldo (R$)',
]

export function EspelhoMedicaoTable({ blocos, medido }: Props) {
  const temItens = blocos.some(b => b.categorias.some(c => c.itens.length > 0))

  // Totais gerais
  let gContr = 0
  let gMed = 0
  for (const b of blocos)
    for (const c of b.categorias)
      for (const it of c.itens) {
        gContr += it.quantidade * it.valor_unitario
        gMed += medido[it.id]?.valor ?? 0
      }
  const gSaldo = gContr - gMed

  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.08]">
        <p className="text-sm font-semibold text-white">Espelho de Medição (por item)</p>
        <p className="text-xs text-white/30 mt-0.5">
          Quanto de cada item do contrato já foi medido e quanto ainda há para receber
        </p>
      </div>

      {!temItens ? (
        <div className="py-16 text-center">
          <p className="text-white/30 text-sm">
            Nenhum item de contrato. Cadastre e feche a Planilha de Venda para medir.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 980 }}>
            <thead className="border-b border-white/[0.08]">
              <tr>
                {HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      'px-3 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap',
                      i >= 4 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {blocos.map(bloco => {
                const temBlocoItens = bloco.categorias.some(c => c.itens.length > 0)
                if (!temBlocoItens) return null
                return (
                  <React.Fragment key={bloco.planilha_id}>
                    {/* Cabeçalho do bloco (Venda / Aditivo N) */}
                    <tr className="bg-[#15161c] border-y border-white/[0.08]">
                      <td colSpan={HEADERS.length} className="px-3 py-2">
                        <span className={cn(
                          'text-xs font-semibold uppercase tracking-wider',
                          bloco.tipo === 'venda' ? 'text-blue-300' : 'text-purple-300'
                        )}>
                          {bloco.label}
                        </span>
                      </td>
                    </tr>

                    {bloco.categorias.map((cat, catIdx) => {
                      if (cat.itens.length === 0) return null
                      return (
                        <React.Fragment key={cat.id}>
                          {/* Categoria */}
                          <tr className="bg-[#111] border-y border-white/[0.05]">
                            <td colSpan={HEADERS.length} className="px-3 py-1.5">
                              <span className="text-white/30 text-xs font-mono mr-2">{catIdx + 1}.</span>
                              <span className="text-white/70 text-xs font-semibold">{cat.nome}</span>
                            </td>
                          </tr>

                          {/* Itens */}
                          {cat.itens.map((it, itemIdx) => {
                            const contr = it.quantidade * it.valor_unitario
                            const med = medido[it.id] ?? { qtd: 0, valor: 0 }
                            const saldo = contr - med.valor
                            const pct = contr > 0 ? (med.valor / contr) * 100 : 0
                            const over = med.valor > contr + 0.005
                            const quitado = !over && saldo < 0.005
                            return (
                              <tr key={it.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                <td className="px-3 py-2 text-white/30 text-xs font-mono whitespace-nowrap">
                                  {catIdx + 1}.{itemIdx + 1}
                                </td>
                                <td className="px-3 py-2 text-white/50 text-xs font-mono whitespace-nowrap">
                                  {it.codigo || '—'}
                                </td>
                                <td className="px-3 py-2 text-white/70 min-w-[180px]">{it.descricao || '—'}</td>
                                <td className="px-3 py-2 text-white/40 text-xs">{it.unidade || '—'}</td>
                                <td className="px-3 py-2 text-right font-mono text-white/60 text-xs">{fmt(it.quantidade)}</td>
                                <td className="px-3 py-2 text-right font-mono text-white/60 text-xs">{fmt(it.valor_unitario)}</td>
                                <td className="px-3 py-2 text-right font-mono text-white/80">{fmtCurrency(contr)}</td>
                                <td className="px-3 py-2 text-right font-mono text-white/60 text-xs">{fmt(med.qtd)}</td>
                                <td className="px-3 py-2 text-right font-mono text-green-400">{fmtCurrency(med.valor)}</td>
                                <td className={cn(
                                  'px-3 py-2 text-right font-mono text-xs',
                                  over ? 'text-red-400' : quitado ? 'text-green-400' : 'text-white/50'
                                )}>
                                  {pct.toFixed(0)}%
                                </td>
                                <td className={cn(
                                  'px-3 py-2 text-right font-mono',
                                  over ? 'text-red-400' : quitado ? 'text-white/30' : 'text-amber-400'
                                )}>
                                  {fmtCurrency(saldo)}
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </React.Fragment>
                )
              })}

              {/* Total geral */}
              <tr className="bg-[#15161c] border-t border-white/10">
                <td colSpan={6} className="px-3 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Total do contrato
                </td>
                <td className="px-3 py-3 text-right font-mono font-semibold text-white">{fmtCurrency(gContr)}</td>
                <td />
                <td className="px-3 py-3 text-right font-mono font-semibold text-green-400">{fmtCurrency(gMed)}</td>
                <td className="px-3 py-3 text-right font-mono text-xs text-white/50">
                  {gContr > 0 ? ((gMed / gContr) * 100).toFixed(0) : '0'}%
                </td>
                <td className="px-3 py-3 text-right font-mono font-semibold text-amber-400">{fmtCurrency(gSaldo)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
