import { PropostaPreview } from '@/components/propostas/PropostaPreview'
import '@/app/globals.css'

export default function Page() {
  const mock = {
    cliente: 'Prefeitura RJ',
    obra: 'Reforma Escola',
    descricao: 'Reforma completa',
    valor: 120000,
    prazoExecucao: 90,
    validade: 30,
    condicoesPagamento: '30/60/90'
  }

  return (
    <div className="page-dark">
      <h1>Detalhe da Proposta</h1>

      <div style={{ marginTop: 20 }}>
        <PropostaPreview data={mock as any} />
      </div>
    </div>
  )
}