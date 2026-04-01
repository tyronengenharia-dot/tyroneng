export function ObraFuncionarios() {
  const funcionarios = [
    { nome: 'João', cargo: 'Engenheiro' },
    { nome: 'Maria', cargo: 'Arquiteta' },
  ]

  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
      <p className="text-gray-400 mb-3">Equipe da obra</p>

      {funcionarios.map((f, i) => (
        <div key={i} className="flex justify-between text-sm mb-2">
          <span>{f.nome}</span>
          <span className="text-gray-400">{f.cargo}</span>
        </div>
      ))}
    </div>
  )
}