export function ObraOverview({ obra }: any) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Orçamento" value={`R$ ${obra.budget}`} />
      <Card title="Status" value={obra.status} />
      <Card title="Local" value={obra.location} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-white font-semibold">{value}</h2>
    </div>
  )
}