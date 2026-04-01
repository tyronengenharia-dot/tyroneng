'use client'

import Link from 'next/link'
import { Proposta } from '@/types/proposta'
import { PropostaStatusBadge } from './PropostaStatusBadge'

export function PropostaTable({ data }: { data: Proposta[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Obra</th>
          <th>Valor</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {data.map((p) => (
          <tr key={p.id}>
            <td>{p.cliente}</td>
            <td>{p.obra}</td>
            <td>R$ {p.valor}</td>
            <td>
              <PropostaStatusBadge status={p.status} />
            </td>
            <td>
              <Link href={`/propostas/${p.id}`}>
                <button className="button secondary">Abrir</button>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}