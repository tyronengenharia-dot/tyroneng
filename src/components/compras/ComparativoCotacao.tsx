'use client'

import { CotacaoFornecedor } from '@/types/compras'

export function ComparativoCotacao({
  cotacoes
}: {
  cotacoes: CotacaoFornecedor[]
}) {
  const menorPreco = Math.min(...cotacoes.map((c) => c.valor))

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th>Fornecedor</th>
          <th>Valor</th>
          <th>Prazo</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {cotacoes.map((c) => (
          <tr key={c.id}>
            <td>{c.fornecedor}</td>
            <td>
              R$ {c.valor}{' '}
              {c.valor === menorPreco && '🟢'}
            </td>
            <td>{c.prazo_dias} dias</td>
            <td>-</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}