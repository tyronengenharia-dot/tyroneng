import { getSolicitacoes } from '@/services/comprasService'
import { SolicitacaoList } from '@/components/compras/SolicitacaoList'

export default async function Page() {
  const data = await getSolicitacoes()

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Solicitações</h1>
      <SolicitacaoList data={data} />
    </div>
  )
}