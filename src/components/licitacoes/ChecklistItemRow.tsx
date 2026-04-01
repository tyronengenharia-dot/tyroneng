export function ChecklistItemRow({ item, onToggle }: any) {
  return (
    <div className="flex justify-between items-center bg-zinc-900 p-3 rounded border border-zinc-800">
      <div>
        <p className="font-medium">{item.nome}</p>
        <span className="text-xs text-zinc-400">
          {item.categoria}
        </span>
      </div>

      <button
        onClick={onToggle}
        className={`px-3 py-1 rounded text-xs ${
          item.status === 'concluido'
            ? 'bg-green-600'
            : 'bg-zinc-700'
        }`}
      >
        {item.status}
      </button>
    </div>
  )
}