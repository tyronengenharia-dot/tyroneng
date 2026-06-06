import type { ComparacaoObra } from '@/types/comparacao'

interface Props {
  obraA: ComparacaoObra | null | undefined
  obraB: ComparacaoObra | null | undefined
}

type MetricKey = 'receitas' | 'despesas' | 'lucro' | 'progresso'

export function ComparacaoDetalhada({ obraA, obraB }: Props) {
  if (!obraA || !obraB) return null

  function calcLucro(o: ComparacaoObra) {
    return o.receitas - o.despesas
  }

  const metrics: { label: string; key: MetricKey }[] = [
    { label: 'Receita', key: 'receitas' },
    { label: 'Despesa', key: 'despesas' },
    { label: 'Lucro', key: 'lucro' },
    { label: 'Progresso', key: 'progresso' },
  ]

  return (
    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">

      <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 mb-4">
        <div></div>
        <div className="text-center">{obraA.name}</div>
        <div className="text-center">{obraB.name}</div>
      </div>

      {metrics.map(metric => {
        const valA =
          metric.key === 'lucro'
            ? calcLucro(obraA)
            : obraA[metric.key]

        const valB =
          metric.key === 'lucro'
            ? calcLucro(obraB)
            : obraB[metric.key]

        const better =
          valA > valB ? 'A' : valB > valA ? 'B' : 'equal'

        return (
          <div
            key={metric.label}
            className="grid grid-cols-3 py-3 border-t border-white/10 text-sm"
          >
            <div className="text-gray-400">{metric.label}</div>

            <div
              className={`text-center ${
                better === 'A' ? 'text-green-400 font-semibold' : ''
              }`}
            >
              {metric.key === 'progresso'
                ? `${valA}%`
                : `R$ ${valA.toLocaleString()}`}
            </div>

            <div
              className={`text-center ${
                better === 'B' ? 'text-green-400 font-semibold' : ''
              }`}
            >
              {metric.key === 'progresso'
                ? `${valB}%`
                : `R$ ${valB.toLocaleString()}`}
            </div>
          </div>
        )
      })}
    </div>
  )
}