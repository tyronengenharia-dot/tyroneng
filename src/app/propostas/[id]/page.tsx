import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MOCK_PROPOSTAS, formatCurrency, formatDate, STATUS_LABEL } from '@/lib/proposta-utils'
import { PropostaStatusBadge } from '@/components/propostas/PropostaStatusBadge'
import { PropostaPreview } from '@/components/propostas/PropostaPreview'

interface Props {
  params: { id: string }
}

async function getProposta(id: string) {
  // TODO: buscar do banco por ID
  return MOCK_PROPOSTAS.find((p) => p.id === id) ?? null
}

export default async function PropostaDetalhePage({ params }: Props) {
  const proposta = await getProposta(params.id)
  if (!proposta) notFound()

  return (
    <div>
      {/* Breadcrumb inline acima das tabs */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-4 -mt-2">
        <Link href="/propostas" className="hover:text-zinc-400 transition-colors">
          Propostas
        </Link>
        <span>/</span>
        <span className="text-zinc-400 font-mono">#{proposta.numero}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Proposta completa */}
        <PropostaPreview data={proposta} showActions />

        {/* Painel lateral */}
        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Status</p>
            </div>
            <div className="p-4">
              <PropostaStatusBadge status={proposta.status} size="md" />

              {/* Timeline simples */}
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Criada', date: formatDate(proposta.createdAt), done: true },
                  {
                    label: 'Enviada ao cliente',
                    date:
                      proposta.status !== 'rascunho'
                        ? 'Enviada'
                        : '—',
                    done: proposta.status !== 'rascunho',
                  },
                  {
                    label:
                      proposta.status === 'aprovada'
                        ? 'Aprovada'
                        : proposta.status === 'rejeitada'
                        ? 'Rejeitada'
                        : 'Aguardando resposta',
                    date:
                      proposta.status === 'aprovada' ||
                      proposta.status === 'rejeitada'
                        ? STATUS_LABEL[proposta.status]
                        : '—',
                    done:
                      proposta.status === 'aprovada' ||
                      proposta.status === 'rejeitada',
                  },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          step.done ? 'bg-amber-500' : 'bg-zinc-700 border border-zinc-600'
                        }`}
                      />
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-800 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-zinc-300 font-medium">{step.label}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">
                        {step.date}
                      </p>
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
                { label: 'CREA', value: proposta.crea ?? '—', mono: true },
                { label: 'CNPJ', value: '40.738.112/0001-69', mono: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-[11px] text-zinc-600">{row.label}</span>
                  <span
                    className={`text-xs text-zinc-300 font-medium ${row.mono ? 'font-mono' : ''}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-400 font-medium">Ações</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <button className="w-full py-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 text-sm font-medium hover:bg-blue-900/40 transition-colors">
                ↗ Exportar PDF
              </button>
              <button className="w-full py-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-sm font-medium hover:bg-emerald-900/40 transition-colors">
                ✓ Marcar como Aprovada
              </button>
              <button className="w-full py-2 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 text-sm font-medium hover:bg-red-900/40 transition-colors">
                ✕ Marcar como Rejeitada
              </button>
              <Link href="/propostas">
                <button className="w-full py-2 rounded-lg border border-zinc-800 text-zinc-500 text-sm hover:border-zinc-700 hover:text-zinc-300 transition-colors">
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
