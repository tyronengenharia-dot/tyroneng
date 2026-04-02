'use client'

import { useEffect, useState } from 'react'
import { Licitacao } from '@/types/licitacao'
import { fmtDate } from '@/lib/licitacaoUtils'

interface Props {
  lic: Licitacao
  onEdit: () => void
}

interface Countdown {
  dias: number
  horas: number
  min: number
  seg: number
}

function getCountdown(dataDisputa: string, horaDisputa: string): Countdown | null {
  if (!dataDisputa) return null
  const target = new Date(`${dataDisputa}T${horaDisputa || '00:00'}`)
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    min: Math.floor((diff % 3600000) / 60000),
    seg: Math.floor((diff % 60000) / 1000),
  }
}

export function LicitacaoDisputa({ lic, onEdit }: Props) {
  const [countdown, setCountdown] = useState<Countdown | null>(
    getCountdown(lic.dataDisputa, lic.horaDisputa)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(lic.dataDisputa, lic.horaDisputa))
    }, 1000)
    return () => clearInterval(interval)
  }, [lic.dataDisputa, lic.horaDisputa])

  const infoItems = [
    { label: 'Processo / Edital', value: lic.processo || '—' },
    { label: 'Lote / Item', value: lic.lote || '—' },
    { label: 'Responsável', value: lic.responsavel || '—' },
    { label: 'Plataforma', value: lic.plataforma || 'Presencial' },
    { label: 'Observações', value: lic.observacoes || '—' },
    { label: 'Modalidade', value: lic.modalidade || '—' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Disputa */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-100">Disputa</h3>
          <button
            onClick={onEdit}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Editar
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-base flex-shrink-0">
              📍
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{lic.local || '—'}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{lic.modalidade || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-base flex-shrink-0">
              🗓️
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">
                {lic.dataDisputa ? fmtDate(lic.dataDisputa) : '—'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {lic.horaDisputa ? `Horário: ${lic.horaDisputa}` : 'Horário não definido'}
              </p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-4">
          {countdown ? (
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: countdown.dias, label: 'Dias' },
                { val: countdown.horas, label: 'Horas' },
                { val: countdown.min, label: 'Min' },
                { val: countdown.seg, label: 'Seg' },
              ].map(({ val, label }) => (
                <div key={label} className="bg-zinc-800 rounded-lg py-2.5 text-center">
                  <p className="text-lg font-bold text-blue-400 font-mono">
                    {String(val).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          ) : lic.dataDisputa ? (
            <p className="text-xs text-zinc-600 text-center py-2">Disputa já realizada</p>
          ) : (
            <p className="text-xs text-zinc-600 text-center py-2">Data da disputa não definida</p>
          )}
        </div>
      </div>

      {/* Info do edital */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4">Informações do Edital</h3>
        <div className="grid grid-cols-2 gap-2">
          {infoItems.map(({ label, value }) => (
            <div key={label} className="bg-zinc-800 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
              <p className="text-sm font-medium text-zinc-100 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
