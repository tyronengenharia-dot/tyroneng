export function EquipeTab() {
  const equipe = [
    { nome: 'João', cargo: 'Engenheiro' },
    { nome: 'Carlos', cargo: 'Mestre de obras' },
  ]

  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
      {equipe.map((e, i) => (
        <div key={i} className="flex justify-between mb-2">
          <span className="text-white">{e.nome}</span>
          <span className="text-gray-400">{e.cargo}</span>
        </div>
      ))}
    </div>
  )
}