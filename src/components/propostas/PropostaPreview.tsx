import { Proposta } from '@/types/proposta'
import { formatCurrency, formatDate } from '@/lib/proposta-utils'
import { PropostaStatusBadge } from './PropostaStatusBadge'

interface Props {
  data: Proposta
  showActions?: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-[10px] text-amber-600 uppercase tracking-widest font-medium whitespace-nowrap">
          {title}
        </p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      {children}
    </div>
  )
}

export function PropostaPreview({ data, showActions = false }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-5">
        <p className="text-[10px] text-amber-600 font-mono tracking-widest mb-1">
          PROPOSTA Nº {data.numero}
        </p>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">{data.obra}</h2>
        <p className="text-sm text-zinc-400">{data.cliente}</p>
        <p className="text-[11px] text-zinc-600 mt-1 font-mono">
          {formatDate(data.createdAt)}
        </p>
        <div className="mt-3">
          <PropostaStatusBadge status={data.status} size="md" />
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Descrição */}
        {data.descricao && (
          <Section title="Descrição">
            <p className="text-sm text-zinc-400 leading-relaxed">{data.descricao}</p>
          </Section>
        )}

        {/* Etapas */}
        {data.etapas && data.etapas.length > 0 && (
          <Section title="Escopo do Serviço">
            <ul className="space-y-2">
              {data.etapas.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400">
                  <span className="text-amber-700 text-xs mt-0.5 shrink-0">▸</span>
                  {e}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Detalhes */}
        <Section title="Detalhes">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Prazo', value: `${data.prazoExecucao} dias corridos` },
              { label: 'Validade', value: `${data.validade} dias` },
              {
                label: 'Responsável',
                value: data.responsavel,
                full: true,
              },
              data.crea ? { label: 'CREA', value: data.crea, mono: true } : null,
            ]
              .filter(Boolean)
              .map((item: any) => (
                <div
                  key={item.label}
                  className={`bg-zinc-900 rounded-lg px-3 py-2.5 ${item.full ? 'col-span-2' : ''}`}
                >
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p
                    className={`text-sm text-zinc-200 font-medium ${item.mono ? 'font-mono text-xs' : ''}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
          </div>
        </Section>

        {/* Investimento */}
        <Section title="Investimento">
          <div className="flex items-center justify-between bg-amber-950/30 border border-amber-800/30 rounded-lg px-4 py-3.5">
            <p className="text-xs text-amber-600">Total do Investimento</p>
            <p className="text-xl font-light text-amber-400 font-mono tracking-tight">
              {formatCurrency(data.valor)}
            </p>
          </div>
        </Section>

        {/* Pagamento */}
        {data.condicoesPagamento && (
          <Section title="Condições de Pagamento">
            <div className="bg-zinc-900 rounded-lg px-3 py-2.5 text-sm text-zinc-400 leading-relaxed">
              {data.condicoesPagamento}
              <p className="text-[11px] text-zinc-600 mt-1">
                Atraso: multa 2% + juros 1% a.m.
              </p>
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800 mt-2">
          <div>
            <p className="text-[10px] text-zinc-600">Emitida por</p>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Tyron Engenharia · CNPJ 40.738.112/0001-69
            </p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <button className="text-[11px] px-3 py-1.5 rounded-md bg-blue-950/60 border border-blue-800/50 text-blue-400 hover:bg-blue-900/40 transition-colors">
                Exportar PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
