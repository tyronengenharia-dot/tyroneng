'use client'

export function NotasFilters({
  type,
  setType,
  status,
  setStatus,
}: any) {
  return (
    <div className="flex flex-col gap-4">

      {/* TIPO */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Tipo</p>

        <div className="flex gap-2">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Emitidas', value: 'emitida' },
            { label: 'Recebidas', value: 'recebida' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setType(item.value)}
              className={`px-3 py-1 rounded-lg text-sm ${
                type === item.value
                  ? 'bg-white text-black'
                  : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATUS */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Status</p>

        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Aprovadas', value: 'aprovada' },
            { label: 'Pendentes', value: 'pendente' },
            { label: 'Canceladas', value: 'cancelada' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setStatus(item.value)}
              className={`px-3 py-1 rounded-lg text-sm ${
                status === item.value
                  ? 'bg-white text-black'
                  : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}