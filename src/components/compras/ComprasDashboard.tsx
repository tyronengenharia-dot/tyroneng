'use client'

export function ComprasDashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">💰 Total Comprado</div>
      <div className="card">📉 Economia</div>
      <div className="card">⏳ Pendentes</div>
      <div className="card">🚚 Atrasos</div>
    </div>
  )
}