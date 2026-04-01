'use client'

import { AuditoriaLog } from '@/types/compras'

export function AuditoriaTimeline({ logs }: { logs: AuditoriaLog[] }) {
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="border-l pl-4 border-zinc-700">
          <p className="text-sm">{log.acao}</p>
          <span className="text-xs text-zinc-500">
            {log.usuario} - {log.data}
          </span>
        </div>
      ))}
    </div>
  )
}