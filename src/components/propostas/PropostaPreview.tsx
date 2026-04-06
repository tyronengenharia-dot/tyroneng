import { Proposta } from '@/types/proposta'
import { PropostaStatusBadge } from './PropostaStatusBadge'

interface Props {
  data: Proposta
  showActions?: boolean
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-[10px] text-amber-600 uppercase tracking-widest font-medium whitespace-nowrap">{title}</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      {children}
    </div>
  )
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-zinc-900 rounded-lg px-3 py-2.5">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-zinc-200 font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

export function PropostaPreview({ data, showActions }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-4">
        <p className="text-[10px] text-amber-600 font-mono tracking-widest mb-1">PROPOSTA Nº {data.numero}</p>
        <h2 className="text-base font-medium text-zinc-100 mb-1 leading-snug">
          {data.tituloCapa.replace(/\n/g, ' — ')}
        </h2>
        <p className="text-sm text-zinc-400">{data.cliente}</p>
        <p className="text-[11px] text-zinc-600 mt-1 font-mono">{data.dataEmissao}</p>
        <div className="mt-3">
          <PropostaStatusBadge status={data.status} size="md" />
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Objetivo */}
        {data.objetivo && (
          <Section title="Objetivo">
            <p className="text-sm text-zinc-400 leading-relaxed">{data.objetivo}</p>
          </Section>
        )}

        {/* Etapas */}
        {data.etapas.length > 0 && (
          <Section title="Etapas do Serviço">
            <ul className="space-y-1.5">
              {data.etapas.filter(Boolean).map((e, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-zinc-400">
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
            <Item label="Prazo"    value={`${data.prazoExecucao} dias corridos`} />
            <Item label="Validade" value={`${data.validade} dias`} />
            <Item label="Responsável" value={data.responsavel} />
            {data.crea && <Item label="CREA" value={data.crea} mono />}
          </div>
        </Section>

        {/* Entregáveis */}
        {data.entregaveis.length > 0 && (
          <Section title="Entregáveis">
            <div className="flex flex-wrap gap-2">
              {data.entregaveis.filter(Boolean).map((e, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">
                  {e}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Investimento */}
        <Section title="Investimento">
          <div className="flex items-center justify-between bg-amber-950/30 border border-amber-800/30 rounded-lg px-4 py-3.5">
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Total do Investimento</p>
              {data.valorExtenso && (
                <p className="text-[10px] text-amber-900 leading-relaxed">{data.valorExtenso}</p>
              )}
            </div>
            <p className="text-xl font-light text-amber-400 font-mono tracking-tight">{brl(data.valor)}</p>
          </div>
        </Section>

        {/* Pagamento */}
        {data.condicoesPagamento && (
          <Section title="Condições de Pagamento">
            <div className="bg-zinc-900 rounded-lg px-3 py-2.5 text-sm text-zinc-400 leading-relaxed">
              {data.condicoesPagamento}
              <p className="text-[11px] text-zinc-600 mt-1">Atraso: multa 2% + juros 1% a.m.</p>
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div>
            <p className="text-[10px] text-zinc-600">Emitida por</p>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Tyron Engenharia · CNPJ 40.738.112/0001-69
            </p>
          </div>
          {showActions && (
            <span className="text-[11px] text-zinc-600 font-mono">{data.numero}</span>
          )}
        </div>
      </div>
    </div>
  )
}
