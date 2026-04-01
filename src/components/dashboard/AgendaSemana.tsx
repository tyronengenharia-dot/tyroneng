'use client'

export function AgendaSemana({ eventos }: any) {
  return (
    <div className="bg-[#111] p-6 rounded-2xl space-y-4">

      <h2 className="text-lg font-semibold">
        🗓️ O que temos essa semana
      </h2>

      {eventos.length === 0 && (
        <p className="text-gray-400">
          Nenhum compromisso essa semana
        </p>
      )}

      {eventos.map((item: any) => {
        const data = new Date(item.data)

        return (
          <div
            key={item.id}
            className="flex justify-between items-center border-b border-[#222] pb-2"
          >
            <div>
              <p className="font-medium">{item.titulo}</p>
              <p className="text-xs text-gray-400">
                {data.toLocaleDateString()} às {data.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {getDiaSemana(data)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function getDiaSemana(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' })
}