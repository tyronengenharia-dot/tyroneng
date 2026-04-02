'use client'

import { useEffect, useState } from 'react'
import { getEstoqueStats } from '@/services/estoqueService'
import { EstoqueStats } from '@/types/estoque'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CARDS = [
  {
    key: 'totalAtivos',
    label: 'Total de Ativos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    format: (v: number) => v.toString(),
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
  },
  {
    key: 'valorTotal',
    label: 'Valor Total em Estoque',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5m0 1h.01" />
      </svg>
    ),
    format: fmt,
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    key: 'emManutencao',
    label: 'Em Manutenção',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    format: (v: number) => v.toString(),
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    key: 'totalVeiculos',
    label: 'Veículos Cadastrados',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
    format: (v: number) => v.toString(),
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
  },
]

export function EstoqueHeader() {
  const [stats, setStats] = useState<EstoqueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEstoqueStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mb-8">
      {/* Title row */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-400 tracking-widest uppercase">
              Painel de Controle
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Gestão de Estoque
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Controle centralizado de todos os ativos da empresa
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-600 mb-1">Atualizado agora</p>
          <div className="text-xs text-gray-500 font-mono">
            {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(card => {
          const value = stats ? (stats as any)[card.key] : null
          return (
            <div
              key={card.key}
              className="rounded-2xl p-5 border border-gray-800/60 relative overflow-hidden"
              style={{ background: '#111113' }}
            >
              {/* Accent glow */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top left, ${card.accent}22, transparent 70%)`,
                }}
              />

              <div className="relative">
                <div
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3"
                  style={{ color: card.accent, background: card.bg }}
                >
                  {card.icon}
                </div>

                <p className="text-xs text-gray-500 mb-1">{card.label}</p>

                {loading ? (
                  <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {value !== null ? card.format(value) : '—'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}