'use client'

const tabs = [
  'dashboard',
  'financeiro',
  'planejamento',
  'equipe',
  'contratos',
  'documentos',
  'medicoes',
  'Plan. Venda',
  'Custo Planejado',
  'Custo Real',

  ]

export function ObraTabs({ tab, setTab }: any) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-3 py-1 rounded-lg text-sm ${
            tab === t
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}