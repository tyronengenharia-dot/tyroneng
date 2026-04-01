import { Proposta } from '@/types/proposta'

export function PropostaPreview({ data }: { data: Proposta }) {
  return (
    <div className="card">
      <h2>Proposta Comercial</h2>

      <p><strong>Cliente:</strong> {data.cliente}</p>
      <p><strong>Obra:</strong> {data.obra}</p>
      <p><strong>Descrição:</strong> {data.descricao}</p>
      <p><strong>Valor:</strong> R$ {data.valor}</p>
      <p><strong>Prazo:</strong> {data.prazoExecucao} dias</p>
      <p><strong>Validade:</strong> {data.validade} dias</p>

      <div style={{ marginTop: 20 }}>
        <strong>Condições:</strong>
        <p>{data.condicoesPagamento}</p>
      </div>
    </div>
  )
}