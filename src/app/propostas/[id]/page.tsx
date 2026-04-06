import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buscarProposta } from '@/services/propostaService'
import { PropostaPreview }    from '@/components/propostas/PropostaPreview'
import { PropostaStatusBadge } from '@/components/propostas/PropostaStatusBadge'
import { ExportarPDFButton }   from '@/components/propostas/ExportarPDFButton'
import { StatusActions }       from '@/components/propostas/StatusActions'

interface Props { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export default async function PropostaDetalhePage({ params }: Props) {
  const { id } = await params
  const proposta = await buscarProposta(id)
  if (!proposta) notFound()

  const timeline = [
    { label: 'Criada',           done: true,                                      date: new Intl.DateTimeFormat('pt-BR').format(new Date(proposta.createdAt)) },
    { label: 'Enviada ao cliente', done: proposta.status !== 'rascunho',           date: proposta.status !== 'rascunho' ? '—' : 'Pendente' },
    { label: proposta.status === 'aprovada' ? 'Aprovada' : proposta.status === 'rejeitada' ? 'Rejeitada' : 'Aguardando resposta',
      done: proposta.status === 'aprovada' || proposta.status === 'rejeitada',
      date: proposta.status === 'aprovada' || proposta.status === 'rejeitada' ? proposta.status : 'Pendente' },
  ]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-5 -mt-2">
        <Link href="/propostas" className="hover:text-zinc-400 transition-colors">Propostas</Link>
        <span>/</span>
        <span className="text-zinc-400 font-mono">#{proposta.numero}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Proposta completa */}
        <PropostaPreview data={proposta} showActions />

        {/* Painel lateral */}
        <div className="flex flex-col gap-4">

          {/* Status + timeline */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Status</p>
            </div>
            <div className="p-4">
              <PropostaStatusBadge status={proposta.status} size="md" />
              <div className="mt-5 space-y-1">
                {timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${step.done ? 'bg-amber-500' : 'bg-zinc-700 border border-zinc-600'}`} />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-zinc-800 mt-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-zinc-300 font-medium">{step.label}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Responsável Técnico</p>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: 'Engenheiro', value: proposta.responsavel },
                { label: 'CREA',       value: proposta.crea,        mono: true },
                { label: 'CNPJ',       value: '40.738.112/0001-69', mono: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center gap-4">
                  <span className="text-[11px] text-zinc-600">{row.label}</span>
                  <span className={`text-xs text-zinc-300 font-medium text-right ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exportar PDF */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Exportar</p>
            </div>
            <div className="p-4">
              <ExportarPDFButton proposta={proposta} variant="panel" />
            </div>
          </div>

          {/* Ações de status + editar + voltar */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Ações</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <StatusActions proposta={proposta} />
              <Link href={`/propostas/${id}/editar`}>
                <button className="w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-amber-700/50 hover:text-amber-400 transition-colors">
                  ✎ Editar Proposta
                </button>
              </Link>
              <Link href="/propostas">
                <button className="w-full py-2 rounded-lg border border-zinc-800 text-zinc-600 text-sm hover:border-zinc-700 hover:text-zinc-400 transition-colors">
                  ← Voltar à lista
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
