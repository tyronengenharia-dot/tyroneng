'use client'

import { useEffect, useState } from 'react'
import { getDocumentos } from '@/services/documentos'

import { ChartResumo } from '@/components/dashboard/ChartResumo'
import { ChartBar } from '@/components/dashboard/ChartBar'
import { getAgenda } from '@/services/agenda'
import { AgendaSemana } from '@/components/dashboard/AgendaSemana'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [agenda, setAgenda] = useState<any[]>([])

  useEffect(() => {
    let id = localStorage.getItem('user_id')

    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('user_id', id)
    }

    setUserId(id)
  }, [])

  async function load() {
    const docs = await getDocumentos(userId!)
    const eventos = await getAgenda(userId!)
    // Adicione aqui a lógica para processar 'docs' e 'eventos' e chamar setData
  }

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  if (!data) return <p className="p-6">Carregando dashboard...</p>

  const statusEmpresa =
    data.vencidos > 0
      ? 'CRÍTICO'
      : data.criticos > 0
      ? 'ALTO RISCO'
      : data.risco > 0
      ? 'ATENÇÃO'
      : 'SEGURO'

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
        <p className="text-gray-400">
          Visão geral da sua documentação
        </p>
      </div>

      <AgendaSemana eventos={agenda} />

      {/* SCORE */}
      <div className="bg-[#111] p-6 rounded-2xl flex justify-between items-center">

        <div>
          <p className="text-sm text-gray-400">Score Geral</p>
          <p className="text-4xl font-bold">{data.score}%</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-400">Status</p>
          <p
            className={`text-lg font-semibold ${
              statusEmpresa === 'CRÍTICO'
                ? 'text-red-400'
                : statusEmpresa === 'ALTO RISCO'
                ? 'text-orange-400'
                : statusEmpresa === 'ATENÇÃO'
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}
          >
            {statusEmpresa}
          </p>
        </div>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">

        <KPI titulo="Vencidos" valor={data.vencidos} cor="red" />
        <KPI titulo="Críticos" valor={data.criticos} cor="orange" />
        <KPI titulo="Risco" valor={data.risco} cor="yellow" />
        <KPI titulo="OK" valor={data.ok} cor="green" />

      </div>

      {/* ALERTAS */}
      <div className="bg-[#111] p-6 rounded-2xl space-y-4">

        <h2 className="text-lg font-semibold">🚨 Ações prioritárias</h2>

        {data.problemas.length === 0 && (
          <p className="text-green-400">✔ Nenhum problema encontrado</p>
        )}

        {data.problemas.slice(0, 5).map((doc: any) => (
          <div
            key={doc.id}
            className="flex justify-between items-center border-b border-[#222] pb-2"
          >
            <div>
              <p className="font-medium">{doc.nome}</p>
              <p className="text-xs text-gray-400">
                {doc.alerta.mensagem}
              </p>
            </div>

            <button
              className="text-blue-400 text-sm"
              onClick={() => (window.location.href = '/documentos')}
            >
              Resolver
            </button>
          </div>
        ))}
      </div>

      {/* INSIGHT */}
      <div className="bg-[#111] p-6 rounded-2xl">

        <h2 className="text-lg font-semibold mb-2">📊 Insight</h2>

        {data.vencidos > 0 && (
          <p className="text-red-400">
            Você possui documentos vencidos — risco imediato de desclassificação.
          </p>
        )}

        {data.criticos > 0 && (
          <p className="text-orange-400">
            Existem documentos que não podem ser emitidos a tempo.
          </p>
        )}

        {data.risco > 0 && (
          <p className="text-yellow-400">
            Alguns documentos estão próximos do prazo crítico.
          </p>
        )}

        {data.score === 100 && (
          <p className="text-green-400">
            ✔ Empresa pronta para licitação
          </p>
        )}

      </div>

      <div className="grid grid-cols-2 gap-6">
        <ChartResumo data={data} />
        <ChartBar data={data} />
      </div>

    </div>
  )
}

function KPI({ titulo, valor, cor }: any) {
  return (
    <div className="bg-[#111] p-4 rounded-xl">
      <p className="text-sm text-gray-400">{titulo}</p>
      <p
        className={`text-2xl font-bold ${
          cor === 'red'
            ? 'text-red-400'
            : cor === 'orange'
            ? 'text-orange-400'
            : cor === 'yellow'
            ? 'text-yellow-400'
            : 'text-green-400'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}