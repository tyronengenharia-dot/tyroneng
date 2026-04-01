export function PlanejamentoTab() {
  const orcado = 500000
  const realizado = 320000

  const percentual = (realizado / orcado) * 100

  return (
    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
      <p className="text-gray-400 mb-2">Execução financeira</p>

      <div className="w-full bg-gray-800 h-3 rounded-full">
        <div
          className="bg-white h-3 rounded-full"
          style={{ width: `${percentual}%` }}
        />
      </div>

      <p className="text-sm text-gray-400 mt-2">
        {percentual.toFixed(1)}% executado
      </p>
    </div>
  )
}