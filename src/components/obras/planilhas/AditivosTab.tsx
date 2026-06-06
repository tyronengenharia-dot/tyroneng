'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Lock } from 'lucide-react'
import { PlanilhaHeader, PlanilhaStatus } from '@/types'
import { getPlanilhasStatus, criarAditivo, fecharAditivo } from '@/services/planilhaEstadoService'
import { Btn, LoadingSpinner } from '@/components/ui'
import { PlanilhaTab } from './PlanilhaTab'

const statusLabel: Record<PlanilhaStatus, string> = {
  rascunho: 'Rascunho',
  aprovada: 'Aprovada',
  fechada: 'Fechado',
  bloqueada: 'Bloqueado',
  liberada: 'Liberado',
}

export function AditivosTab({ obra_id }: { obra_id: string }) {
  const [headers, setHeaders] = useState<PlanilhaHeader[]>([])
  const [loading, setLoading] = useState(true)
  const [selId, setSelId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getPlanilhasStatus(obra_id).then(hs => {
      if (!active) return
      setHeaders(hs)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [obra_id])

  async function refresh() {
    setHeaders(await getPlanilhasStatus(obra_id))
  }

  const venda = headers.find(h => h.tipo === 'venda')
  const vendaFechada = venda?.status === 'fechada'
  const semEstado = headers.length === 0
  const aditivos = headers
    .filter(h => h.tipo === 'aditivo')
    .sort((a, b) => (a.aditivo_numero ?? 0) - (b.aditivo_numero ?? 0))
  const sel = aditivos.find(a => a.id === selId) ?? null

  async function handleCriar() {
    setBusy(true)
    const { id, error } = await criarAditivo(obra_id)
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Aditivo criado.')
    await refresh()
    if (id) setSelId(id)
  }

  async function handleFechar(planilha_id: string) {
    if (!confirm('Fechar este aditivo? Ele ficará somente leitura.')) return
    setBusy(true)
    const { error } = await fecharAditivo(planilha_id)
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Aditivo fechado.')
    refresh()
  }

  if (loading) return <LoadingSpinner />

  if (semEstado) {
    return (
      <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
        A gestão de aditivos requer a migration de planilhas aplicada no banco.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho + criar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0d0d0d] border border-white/[0.08] rounded-2xl">
        <div>
          <p className="text-sm font-semibold text-white">Aditivos</p>
          <p className="text-xs text-white/30 mt-0.5">
            {vendaFechada
              ? `${aditivos.length} aditivo(s) — serviços/modificações não previstos na Venda`
              : 'Disponível após o fechamento da Planilha de Venda'}
          </p>
        </div>
        <Btn variant="primary" onClick={handleCriar} disabled={!vendaFechada || busy}>
          <Plus size={14} /> Criar Aditivo
        </Btn>
      </div>

      {!vendaFechada && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <Lock size={13} /> Feche a Planilha de Venda para liberar a criação de aditivos.
        </div>
      )}

      {/* Seletor de aditivos */}
      {aditivos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {aditivos.map(a => (
            <button
              key={a.id}
              onClick={() => setSelId(a.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selId === a.id
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/8'
              }`}
            >
              Aditivo {a.aditivo_numero} · {statusLabel[a.status]}
            </button>
          ))}
        </div>
      )}

      {/* Planilha do aditivo selecionado */}
      {sel && (
        <div className="space-y-2">
          {sel.status === 'rascunho' && (
            <div className="flex justify-end">
              <button
                onClick={() => handleFechar(sel.id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-xl hover:bg-blue-500/25 transition-colors disabled:opacity-50"
              >
                <Lock size={13} /> Fechar Aditivo {sel.aditivo_numero}
              </button>
            </div>
          )}
          <PlanilhaTab
            key={sel.id}
            obra_id={obra_id}
            tipo="aditivo"
            planilhaId={sel.id}
            status={sel.status}
            title={`Aditivo ${sel.aditivo_numero}`}
            subtitle="Serviços e modificações não previstos na Planilha de Venda original"
          />
        </div>
      )}

      {vendaFechada && aditivos.length === 0 && (
        <p className="text-sm text-white/30 py-6 text-center">
          Nenhum aditivo ainda. Clique em &quot;Criar Aditivo&quot;.
        </p>
      )}
    </div>
  )
}
