'use client'

import { cn } from '@/lib/utils'

export type ObraTab =
  | 'dashboard'
  | 'financeiro'
  | 'planejamento'
  | 'medicoes'
  | 'venda'
  | 'custo-planejado'
  | 'custo-real'
  | 'equipe'
  | 'documentos'
  | 'diario'
  | 'riscos'

const TABS: { id: ObraTab; label: string }[] = [
  { id: 'dashboard',       label: 'Dashboard' },
  { id: 'financeiro',      label: 'Financeiro' },
  { id: 'planejamento',    label: 'Planejamento' },
  { id: 'medicoes',        label: 'Medições' },
  { id: 'venda',           label: 'Plan. Venda' },
  { id: 'custo-planejado', label: 'Custo Planejado' },
  { id: 'custo-real',      label: 'Custo Real' },
  { id: 'equipe',          label: 'Equipe' },
  { id: 'documentos',      label: 'Docs & Contratos' },
  { id: 'diario',          label: 'Diário de Obra' },
  { id: 'riscos',          label: 'Riscos' },
]

type Props = {
  tab: ObraTab
  setTab: (t: ObraTab) => void
}

export function ObraTabs({ tab, setTab }: Props) {
  return (
    <div className="flex gap-1 bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-1 overflow-x-auto mb-5 scrollbar-hide">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-150',
            tab === t.id
              ? 'bg-[#1c1c1c] text-white border border-white/10 shadow-sm'
              : 'text-white/40 hover:text-white/70'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
