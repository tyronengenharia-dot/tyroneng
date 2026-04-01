'use client'

type Props = {
  search: string
  setSearch: (v: string) => void
  type: string
  setType: (v: string) => void
}

export function FinanceToolbar({ search, setSearch, type, setType }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between">
      <input
        placeholder="Buscar transação..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border p-2 rounded-xl w-full md:w-72"
      />

      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="border p-2 rounded-xl"
      >
        <option value="todos">Todos</option>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>
    </div>
  )
}