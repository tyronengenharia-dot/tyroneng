'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, CheckCircle2, Unlock, AlertTriangle } from 'lucide-react'
import { PlanilhaHeader, PlanilhaStatus, PlanilhaTipo } from '@/types'
import {
  fecharVenda,
  aprovarCustoPlanejado,
  custoRealTemItens,
  reabrirCustoPlanejado,
} from '@/services/planilhaEstadoService'
import { Modal, Btn } from '@/components/ui'

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
  // Modal de reabertura destrutiva: guarda quantos itens do Custo Real serão
  // apagados. null = fechado. `confirmado` é o 2º passo da dupla confirmação.
  const [reabrirQtd, setReabrirQtd] = useState<number | null>(null)
  const [confirmado, setConfirmado] = useState(false)

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

  // Reabrir o Custo Planejado aprovado. Se o Custo Real ainda está vazio,
  // reabre com uma confirmação simples. Se já tem dados, abre o modal de dupla
  // confirmação (apagar tudo do Custo Real).
  async function handleReabrirClick() {
    setBusy(true)
    const qtd = await custoRealTemItens(obra_id)
    setBusy(false)
    if (qtd === 0) {
      if (!confirm('Reabrir o Custo Planejado para edição? O Custo Real voltará a ficar bloqueado.')) return
      await doReabrir(false)
    } else {
      setConfirmado(false)
      setReabrirQtd(qtd)
    }
  }

  async function doReabrir(apagarCustoReal: boolean) {
    setBusy(true)
    const { error } = await reabrirCustoPlanejado(obra_id, apagarCustoReal)
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    setReabrirQtd(null)
    toast.success('Custo Planejado reaberto para edição.')
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
  } else if (tipo === 'custo_planejado' && plan?.status === 'aprovada') {
    acao = (
      <button
        disabled={busy}
        onClick={handleReabrirClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-xl hover:bg-amber-500/25 transition-colors disabled:opacity-50"
      >
        <Unlock size={13} /> Reabrir Custo Planejado
      </button>
    )
  }

  return (
    <>
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

      {reabrirQtd !== null && (
        <Modal
          title="Reabrir Custo Planejado"
          subtitle="Esta ação apaga o Custo Real"
          onClose={() => { if (!busy) setReabrirQtd(null) }}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setReabrirQtd(null)} disabled={busy}>
                Cancelar
              </Btn>
              <Btn variant="danger" onClick={() => doReabrir(true)} disabled={!confirmado || busy}>
                {busy ? 'Reabrindo…' : 'Reabrir e apagar Custo Real'}
              </Btn>
            </>
          }
        >
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm text-white/70 space-y-1.5">
              <p>
                O Custo Real já tem{' '}
                <strong className="text-white">{reabrirQtd} {reabrirQtd === 1 ? 'item' : 'itens'}</strong>{' '}
                preenchido{reabrirQtd === 1 ? '' : 's'}.
              </p>
              <p>
                Reabrir o Custo Planejado vai <strong className="text-red-300">apagar permanentemente</strong>{' '}
                todos os itens e categorias do Custo Real, que voltará a ficar bloqueado.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={e => setConfirmado(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-500 cursor-pointer"
            />
            <span className="text-sm text-white/60">
              Entendo que os dados do Custo Real serão apagados e não poderão ser recuperados.
            </span>
          </label>
        </Modal>
      )}
    </>
  )
}
