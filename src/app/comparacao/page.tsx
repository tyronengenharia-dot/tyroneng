'use client'

import { useEffect, useState } from 'react'
import { getComparacao } from '@/services/comparacaoService'

import { ComparacaoSelector } from '@/components/comparacao/ComparacaoSelector'
import { ComparacaoDetalhada } from '@/components/comparacao/ComparacaoDetalhada'

export default function ComparacaoPage() {
  const [data, setData] = useState<any[]>([])
  const [obraA, setObraA] = useState<string | null>(null)
  const [obraB, setObraB] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      const result = await getComparacao()
      setData(result)

      // define padrão inicial
      if (result.length >= 2) {
        setObraA(result[0].id)
        setObraB(result[1].id)
      }
    }

    fetch()
  }, [])

  const obraSelecionadaA = data.find(o => o.id === obraA)
  const obraSelecionadaB = data.find(o => o.id === obraB)

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Comparação de Obras
        </h1>
        <p className="text-gray-400 text-sm">
          Compare desempenho entre duas obras
        </p>
      </div>

      <ComparacaoSelector
        obras={data}
        obraA={obraA}
        setObraA={setObraA}
        obraB={obraB}
        setObraB={setObraB}
      />

      <ComparacaoDetalhada
        obraA={obraSelecionadaA}
        obraB={obraSelecionadaB}
      />
    </div>
  )
}