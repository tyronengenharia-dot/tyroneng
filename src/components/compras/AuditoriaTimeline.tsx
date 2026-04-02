'use client'

import { useMemo } from 'react'
import type { AuditoriaLog } from '@/types/compras'
import { formatarDataHora } from '@/lib/formatters'

interface Props {
  logs: AuditoriaLog[]
}

const TIPO_CONFIG: Record<string, { cor: string; icone: string }> = {
  criada:     { cor: 'bg-emerald-500', icone: '✦' },
  adicionada: { cor: 'bg-indigo-500',  icone: '◈' },
  selecionada:{ cor: 'bg-teal-500',    icone: '✔' },
  aprovado:   { cor: 'bg-emerald-500', icone: '✔' },
  recusada:   { cor: 'bg-red-500',     icone: '✕' },
  confirmada: { cor: 'bg-emerald-500', icone: '✔' },
  gerado:     { cor: 'bg-indigo-500',  icone: '◈' },
  atrasado:   { cor: 'bg-amber-500',   icone: '⚠' },
  alterado:   { cor: 'bg-zinc-500',    icone: '~' },
}

function getCorLog(acao: string) {
  const key = Object.keys(TIPO_CONFIG).find((k) =>
    acao.toLowerCase().includes(k)
  )
  return TIPO_CONFIG[key ?? ''] ?? { cor: 'bg-zinc-600', icone: '·' }
}

function agruparPorData(logs: AuditoriaLog[]) {
  const grupos: Record<string, AuditoriaLog[]> = {}
  for (const log of logs) {
    const data = log.data.split('T')[0]
    if (!grupos[data]) grupos[data] = []
    grupos[data].push(log)
  }
  return Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a))
}

function formatarDataGrupo(data: string) {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (data === hoje) return 'Hoje'
  if (data === ontem) return 'Ontem'
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function AuditoriaTimeline({ logs }: Props) {
  const grupos = useMemo(() => agruparPorData(logs), [logs])

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-[12px] text-zinc-500">
        Nenhum registro de auditoria
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Timeline */}
      <div className="lg:col-span-2 space-y-6">
        {grupos.map(([data, itens]) => (
          <div key={data}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-zinc-400">
                {formatarDataGrupo(data)}
              </span>
              <div className="flex-1 border-t border-zinc-800" />
              <span className="text-[10px] text-zinc-600">{itens.length} ações</span>
            </div>

            <div className="relative space-y-0">
              {/* Linha vertical */}
              <div className="absolute left-[7px] top-2 bottom-0 w-px bg-zinc-800" />

              {itens.map((log) => {
                const cfg = getCorLog(log.acao)
                return (
                  <div key={log.id} className="group relative flex gap-4 pb-4 last:pb-0">
                    {/* Dot */}
                    <div className={`relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ${cfg.cor} flex items-center justify-center`}>
                      <span className="text-[6px] text-white font-bold">{cfg.icone}</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 rounded-lg border border-transparent px-3 py-2 transition-colors group-hover:border-zinc-800 group-hover:bg-zinc-900/60">
                      <p className="text-[12px] font-medium text-zinc-200">{log.acao}</p>
                      {log.descricao && (
                        <p className="mt-0.5 text-[11px] text-zinc-500">{log.descricao}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[8px] font-bold text-zinc-400">
                          {log.usuario.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-zinc-500">{log.usuario}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">{formatarDataHora(log.data)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Painel lateral: ações por usuário */}
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Ações por Usuário
          </h3>
          <div className="space-y-3">
            {Object.entries(
              logs.reduce<Record<string, number>>((acc, log) => {
                acc[log.usuario] = (acc[log.usuario] ?? 0) + 1
                return acc
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .map(([usuario, total]) => {
                const max = logs.length
                return (
                  <div key={usuario}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-[9px] font-bold text-indigo-400">
                          {usuario.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-zinc-300">{usuario}</span>
                      </div>
                      <span className="text-zinc-500">{total}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-1 rounded-full bg-indigo-500/60"
                        style={{ width: `${(total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Por Tipo de Ação
          </h3>
          <div className="space-y-2">
            {Object.entries(
              logs.reduce<Record<string, number>>((acc, log) => {
                const key = Object.keys(TIPO_CONFIG).find((k) =>
                  log.acao.toLowerCase().includes(k)
                ) ?? 'outro'
                acc[key] = (acc[key] ?? 0) + 1
                return acc
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([tipo, total]) => {
                const cfg = TIPO_CONFIG[tipo] ?? { cor: 'bg-zinc-600', icone: '·' }
                return (
                  <div key={tipo} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${cfg.cor}`} />
                      <span className="capitalize text-zinc-400">{tipo}</span>
                    </div>
                    <span className="text-zinc-500">{total}x</span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
