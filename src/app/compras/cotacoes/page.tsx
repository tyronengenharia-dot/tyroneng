import { ComparativoCotacao } from '@/components/compras/ComparativoCotacao'

export default function Page() {
  const mock = [
    { id: '1', fornecedor: 'Fornecedor A', valor: 1000, prazo_dias: 5, condicoes: '' },
    { id: '2', fornecedor: 'Fornecedor B', valor: 900, prazo_dias: 7, condicoes: '' }
  ]

  return (
    <div className="p-6">
      <h1>Cotações</h1>
      <ComparativoCotacao cotacoes={mock} />
    </div>
  )
}