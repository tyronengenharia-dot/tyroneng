'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, CheckCircle2 } from 'lucide-react'
import { PlanilhaHeader, PlanilhaStatus, PlanilhaTipo } from '@/types'
import { fecharVenda, aprovarCustoPlanejado } from '@/services/planilhaEstadoService'

const statusInfo: Record<PlanilhaStatus, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-white/5 text-white/50 border-white/10' },
  aprovada: { label: 'Aprovada', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  fechada: { label: 'Fechada', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  bloqueada: { label: 'Bloqueada', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  liberada: { label: 'Liberada', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

const tipoLabel: Record<string, string> = {
  venda: 'Venda',
  custo_planejado: 'Custo Plan.',
  custo_real: 'Custo Real',
}

type Props = {
  obra_id: string
  tipo: PlanilhaTipo
  headers: PlanilhaHeader[]
  onChanged: () => void
}

export function PlanilhaEstadoBar({ obra_id, tipo, headers, onChanged }: Props) {
  const [busy, setBusy] = useState(false)

  const fluxo = (['venda', 'custo_planejado', 'custo_real'] as const)
    .map(t => headers.find(h => h.tipo === t))
    .filter((h): h is PlanilhaHeader => Boolean(h))

  async function run(
    fn: () => Promise<{ error: string | null }>,
    confirmMsg: string,
    okMsg: string
  ) {
    if (!confirm(confirmMsg)) return
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(okMsg)
    onChanged()
  }

  const venda = headers.find(h => h.tipo === 'venda')
  const plan = headers.find(h => h.tipo === 'custo_planejado')

  let acao: React.ReactNode = null
  if (tipo === 'venda' && venda?.status === 'rascunho') {
    acao = (
      <button
        disabled={busy}
        onClick={() =>
          run(
            () => fecharVenda(obra_id),
            'Fechar a Planilha de Venda? Isso trava as edições da Venda e libera a criação de aditivos.',
            'Venda fechada.'
          )
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-xl hover:bg-blue-500/25 transition-colors disabled:opacity-50"
      >
        <Lock size={13} /> Fechar Venda
      </button>
    )
  } else if (tipo === 'custo_planejado' && plan?.status === 'rascunho') {
    acao = (
      <button
        disabled={busy}
        onClick={() =>
          run(
            () => aprovarCustoPlanejado(obra_id),
            'Aprovar o Custo Planejado? Ele será travado e o Custo Real liberado para edição. Esta ação define a linha de base do custo.',
            'Custo Planejado aprovado — Custo Real liberado.'
          )
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/15 text-green-300 border border-green-500/25 rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50"
      >
        <CheckCircle2 size={13} /> Aprovar Custo Planejado
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#111] border border-white/[0.08] rounded-xl flex-wrap">
      <div className="flex items-center gap-3 flex-wrap text-xs">
        {fluxo.map(h => (
          <span key={h.tipo} className="inline-flex items-center gap-1.5">
            <span className="text-white/40">{tipoLabel[h.tipo] ?? h.tipo}</span>
            <span className={`px-2 py-0.5 rounded-full border ${statusInfo[h.status].cls}`}>
              {statusInfo[h.status].label}
            </span>
          </span>
        ))}
      </div>
      {acao && <div className="flex items-center gap-2">{busy ? <span className="text-xs text-white/40">Processando...</span> : acao}</div>}
    </div>
  )
}
