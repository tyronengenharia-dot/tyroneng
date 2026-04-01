'use client'

import { useRouter } from 'next/navigation'
import { PropostaForm } from '@/components/propostas/PropostaForm'
import '@/app/globals.css'

export default function Page() {
  const router = useRouter()

  function handleCreate(data: any) {
    console.log('Proposta criada:', data)

    router.push('/propostas')
  }

  return (
    <div className="page-dark">
      <h1>Nova Proposta</h1>

      <div style={{ marginTop: 20 }}>
        <PropostaForm onSubmit={handleCreate} />
      </div>
    </div>
  )
}