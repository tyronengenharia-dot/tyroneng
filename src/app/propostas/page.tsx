import Link from 'next/link'
import { PropostaTable } from '@/components/propostas/PropostaTable'
import '@/app/globals.css'

const mock = [
  {
    id: '1',
    cliente: 'Prefeitura RJ',
    obra: 'Reforma Escola',
    valor: 120000,
    status: 'enviada'
  }
]

export default function Page() {
  return (
    <div className="page-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Propostas</h1>

        <Link href="/propostas/nova">
          <button className="button">+ Nova</button>
        </Link>
      </div>

      <div style={{ marginTop: 20 }}>
        <PropostaTable data={mock as any} />
      </div>
    </div>
  )
}