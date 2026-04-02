'use client'

import type { SolicitacaoCompra, Entrega, MetricasCompras } from '@/types/compras'
import { ComprasMetrics } from './ComprasMetrics'
import { BadgeStatus, BadgeUrgencia } from './ComprasBadges'
import { formatarData, formatarMoeda } from '@/lib/formatters'

interface Props {
  metricas: MetricasCompras
  solicitacoesRecentes: SolicitacaoCompra[]
  entregasAtivas: Entrega[]
  onTabChange: (tab: string) => void
}

const PROGRESSO_ENTREGA: Record<string, number> = {
  aguardando: 10,
  transporte: 65,
  entregue: 100,
  atrasado: 45,
}

const COR_PROGRESSO: Record<string, string> = {
  aguardando: 'bg-zinc-600',
  transporte: 'bg-indigo-500',
  entregue: 'bg-emerald-500',
  atrasado: 'bg-amber-500',
}

const GASTOS_MOCK = [
  { mes: 'Jan', valor: 210, orcamento: 220 },
  { mes: 'Fev', valor: 185, orcamento: 220 },
  { mes: 'Mar', valor: 245, orcamento: 220 },
  { mes: 'Abr', valor: 202, orcamento: 220 },
]

const MAX_GASTO = 260

export function ComprasDashboard({ metricas, solicitacoesRecentes, entregasAtivas, onTabChange }: Props) {
  return (
    <div className="space-y-5">
      <ComprasMetrics metricas={metricas} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Gráfico de gastos */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Gastos por Mês</h3>
              <p className="text-[11px] text-zinc-500">Jan–Abr 2026 · em R$ mil</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="inline-block h-2 w-3 rounded-sm bg-indigo-500/70" />
                Realizado
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="inline-block h-px w-3 border-t border-dashed border-amber-500" />
                Orçamento
              </span>
            </div>
          </div>
          <div className="flex h-36 items-end gap-3">
            {GASTOS_MOCK.map((g) => {
              const alturaReal = (g.valor / MAX_GASTO) * 100
              const alturaOrc = (g.orcamento / MAX_GASTO) * 100
              return (
                <div key={g.mes} className="group relative flex flex-1 flex-col items-center gap-1">
                  {/* Tooltip */}
                  <div className="absolute -top-8 hidden rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 group-hover:block">
                    R$ {g.valor}k
                  </div>
                  <div className="relative flex w-full flex-1 items-end">
                    {/* Linha de orçamento */}
                    <div
                      className="absolute inset-x-0 border-t border-dashed border-amber-500/50"
                      style={{ bottom: `${alturaOrc}%` }}
                    />
                    {/* Barra */}
                    <div
                      className="w-full rounded-t-md bg-indigo-500/70 transition-all group-hover:bg-indigo-400"
                      style={{ height: `${alturaReal}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{g.mes}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Categorias */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Por Categoria</h3>
          <div className="space-y-3">
            {[
              { cat: 'Estrutura', pct: 38, cor: 'bg-indigo-500' },
              { cat: 'Acabamento', pct: 25, cor: 'bg-teal-500' },
              { cat: 'Elétrica', pct: 20, cor: 'bg-amber-500' },
              { cat: 'Hidráulica', pct: 10, cor: 'bg-purple-500' },
              { cat: 'Outros', pct: 7, cor: 'bg-zinc-500' },
            ].map(({ cat, pct, cor }) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-zinc-400">{cat}</span>
                  <span className="font-medium text-zinc-300">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className={`h-1.5 rounded-full ${cor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Solicitações recentes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-zinc-200">Solicitações Recentes</h3>
            <button
              onClick={() => onTabChange('solicitacoes')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {solicitacoesRecentes.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors">
                <BadgeUrgencia urgencia={s.urgencia} somente_dot />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-zinc-200">{s.descricao}</p>
                  <p className="text-[10px] text-zinc-500">{s.categoria} · {formatarData(s.data_necessaria)}</p>
                </div>
                <BadgeStatus status={s.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Entregas ativas */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-zinc-200">Entregas em Andamento</h3>
            <button
              onClick={() => onTabChange('entregas')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {entregasAtivas.slice(0, 4).map((e) => (
              <div key={e.id} className="px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-zinc-200">
                      {e.descricao_item ?? e.pedido?.descricao_item}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {e.fornecedor ?? e.pedido?.fornecedor} · Prev. {formatarData(e.data_prevista)}
                    </p>
                  </div>
                  <BadgeStatus status={e.status as string} />
                </div>
                <div className="h-1 rounded-full bg-zinc-800">
                  <div
                    className={`h-1 rounded-full transition-all ${COR_PROGRESSO[e.status]}`}
                    style={{ width: `${PROGRESSO_ENTREGA[e.status]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
