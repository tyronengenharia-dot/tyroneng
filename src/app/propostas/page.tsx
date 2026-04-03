import { PropostaStatsBar } from '@/components/propostas/PropostaStatsBar'
import { PropostaTable } from '@/components/propostas/PropostaTable'
import { MOCK_PROPOSTAS } from '@/lib/proposta-utils'

// Em produção: buscar do banco via Server Component ou React Query
async function getPropostas() {
  return MOCK_PROPOSTAS
}

export default async function PropostasPage() {
  const propostas = await getPropostas()

  return (
    <div>
      <PropostaStatsBar propostas={propostas} />
      <PropostaTable data={propostas} />
    </div>
  )
}
