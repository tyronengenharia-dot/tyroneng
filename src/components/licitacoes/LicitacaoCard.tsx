export function LicitacaoCard({ lic }: any) {
  const progress =
    lic.checklist.filter((i: any) => i.status === 'concluido').length /
    lic.checklist.length

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-blue-500 transition">
      <h2 className="text-lg font-semibold">{lic.titulo}</h2>
      <p className="text-sm text-zinc-400">{lic.orgao}</p>

      <div className="mt-3">
        <div className="h-2 bg-zinc-800 rounded">
          <div
            className="h-2 bg-blue-500 rounded"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  )
}