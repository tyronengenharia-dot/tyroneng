'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Proposta, PropostaStatus } from '@/types/proposta'

interface Props {
  proposta: Proposta
}

const ACTIONS: {
  label: string
  status: PropostaStatus
  style: string
}[] = [
  {
    label: '✓ Marcar como Aprovada',
    status: 'aprovada',
    style: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40',
  },
  {
    label: '↗ Marcar como Enviada',
    status: 'enviada',
    style: 'bg-blue-950/60 border-blue-800/50 text-blue-400 hover:bg-blue-900/40',
  },
  {
    label: '✕ Marcar como Rejeitada',
    status: 'rejeitada',
    style: 'bg-red-950/60 border-red-800/50 text-red-400 hover:bg-red-900/40',
  },
]

export function StatusActions({ proposta }: Props) {
  const { id, status: currentStatus } = proposta
  const router = useRouter()
  const [loading, setLoading] = useState<PropostaStatus | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function updateStatus(status: PropostaStatus) {
    if (status === currentStatus) return
    setLoading(status)
    setError(null)
    try {
      const res = await fetch(`/api/propostas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erro ${res.status}`)
      }
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {ACTIONS.filter(a => a.status !== currentStatus).map(action => (
        <button
          key={action.status}
          onClick={() => updateStatus(action.status)}
          disabled={!!loading}
          className={`
            w-full py-2 rounded-lg border text-sm font-medium transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${action.style}
          `}
        >
          {loading === action.status
            ? <span className="flex items-center justify-center gap-2"><Spin /> Atualizando...</span>
            : action.label}
        </button>
      ))}
      {error && (
        <p className="text-[11px] text-red-400 px-1">{error}</p>
      )}
    </div>
  )
}

function Spin() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
  )
}
