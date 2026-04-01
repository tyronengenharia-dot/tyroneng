import { AuditoriaTimeline } from '@/components/compras/AuditoriaTimeline'

export default function Page() {
  const logs = [
    { id: '1', acao: 'Criou solicitação', usuario: 'Rodrigo', data: '2026-04-01', referencia_id: '1' }
  ]

  return (
    <div className="p-6">
      <h1>Auditoria</h1>
      <AuditoriaTimeline logs={logs} />
    </div>
  )
}