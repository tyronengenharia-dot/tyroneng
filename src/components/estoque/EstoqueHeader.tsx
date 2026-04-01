export function EstoqueHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-gray-400 text-sm">
          Controle de ativos da empresa
        </p>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">
        + Adicionar
      </button>
    </div>
  )
}