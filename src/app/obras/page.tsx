'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Obra = {
  id: string
  nome: string
  status: 'andamento' | 'concluida' | 'atrasada'
  created_at: string
}

export default function DashboardObras() {
  const [obras, setObras] = useState<Obra[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchObras() {
      // 👉 depois você liga no Supabase aqui
      const data: Obra[] = [
        {
          id: '1',
          nome: 'Obra Centro RJ',
          status: 'andamento',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          nome: 'Reforma Copacabana',
          status: 'concluida',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          nome: 'Prédio Comercial Niterói',
          status: 'atrasada',
          created_at: new Date().toISOString(),
        },
      ]

      setObras(data)
    }

    fetchObras()
  }, [])

  const total = obras.length
  const andamento = obras.filter(o => o.status === 'andamento').length
  const concluida = obras.filter(o => o.status === 'concluida').length
  const atrasada = obras.filter(o => o.status === 'atrasada').length

  

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-white">🏗️ Dashboard de Obras</h1>
    <p className="text-gray-400 text-sm">Visão geral das suas obras</p>
  </div>

  <button className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2 rounded-xl text-white font-medium shadow-lg">
    + Nova Obra
  </button>
</div>


      {/* CARDS */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
                        <p className="text-sm text-gray-400">Total de Obras</p>
                        <h2 className="text-3xl font-bold text-white">{total}</h2>
                      </div>

                      <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                        <p className="text-sm text-blue-400">Em Andamento</p>
                        <h2 className="text-3xl font-bold text-blue-500">{andamento}</h2>
                      </div>

                      <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20">
                        <p className="text-sm text-green-400">Concluídas</p>
                        <h2 className="text-3xl font-bold text-green-500">{concluida}</h2>
                      </div>

                      <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                        <p className="text-sm text-red-400">Atrasadas</p>
                        <h2 className="text-3xl font-bold text-red-500">{atrasada}</h2>
                      </div>
                    </div>


      {/* LISTA RECENTE */}
      <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
        <h2 className="text-white font-semibold mb-4 text-lg"> OBRAS  </h2>

            <div className="space-y-3">
                {obras.map((obra) => (
                  
<Link
  href={`/obras/${obra.id}`}
  className="flex items-center justify-between bg-[#111] p-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer"
>
                  <div>
                    <p className="text-white font-medium">{obra.nome}</p>
                    <p className="text-xs text-gray-400">Atualizado recentemente</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                        {  obra.status === 'andamento' && 'Em andamento'}
                        {  obra.status === 'concluida' && 'Concluída'}
                        {  obra.status === 'atrasada' && 'Atrasada'}
                  `}>
                    {obra.status}
                  </span>
                </Link>
              ))}
            </div>
      </div>
    </div>
  )
}
