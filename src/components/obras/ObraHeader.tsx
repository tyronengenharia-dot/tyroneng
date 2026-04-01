export function ObraHeader({ obra }: any) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {obra.name}
        </h1>
        <p className="text-gray-400 text-sm">
          {obra.client} • {obra.location}
        </p>
      </div>

      <div className="flex gap-2">
        <button className="bg-white text-black px-4 py-2 rounded-xl">
          Editar
        </button>

        <button className="bg-[#1a1a1a] px-4 py-2 rounded-xl text-gray-300">
          Relatório
        </button>
      </div>
    </div>
  )
}