import { PropostaStatsBar } from '@/components/propostas/PropostaStatsBar'
import { PropostaTable }   from '@/components/propostas/PropostaTable'
import { listarPropostas } from '@/services/propostaService'
import { Proposta } from '@/types/proposta'

// Server Component — busca direto do Supabase, sem useEffect
export const dynamic = 'force-dynamic' // nunca cachear — sempre dados frescos

export default async function PropostasPage() {
  let propostas: Proposta[] = []
  let erro: string | null = null

  try {
    propostas = await listarPropostas()
  } catch (e: any) {
    erro = e.message
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-zinc-400 text-sm">Erro ao carregar propostas</p>
          <p className="text-zinc-600 text-xs mt-1 font-mono">{erro}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PropostaStatsBar propostas={propostas} />
      <PropostaTable data={propostas} />
    </div>
  )
}
