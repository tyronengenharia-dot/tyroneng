'use client'

import { useEffect, useState } from 'react'
import { Upload, Eye, Trash2 } from 'lucide-react'
import { ReferenciaFonte, ReferenciaVersaoComContagem } from '@/types/referencia'
import { getVersoes, deleteVersao } from '@/services/referenciaService'
import { ImportarReferenciaModal } from '@/components/referencias/ImportarReferenciaModal'
import { ReferenciaItensModal } from '@/components/referencias/ReferenciaItensModal'
import {
  LoadingSpinner,
  EmptyState,
  KpiCard,
  Btn,
  TableCard,
  TableHead,
  Th,
  Td,
} from '@/components/ui'

const meses = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const filtros: { value: 'todas' | ReferenciaFonte; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'emop', label: 'EMOP' },
  { value: 'sinapi', label: 'SINAPI' },
]

const fonteBadge: Record<ReferenciaFonte, string> = {
  emop: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sinapi: 'bg-green-500/10 text-green-400 border-green-500/20',
}

export default function ReferenciasPage() {
  const [data, setData] = useState<ReferenciaVersaoComContagem[]>([])
  const [loading, setLoading] = useState(true)
  const [fonte, setFonte] = useState<'todas' | ReferenciaFonte>('todas')
  const [openImport, setOpenImport] = useState(false)
  const [verItens, setVerItens] = useState<ReferenciaVersaoComContagem | null>(null)

  async function fetchData() {
    setLoading(true)
    setData(await getVersoes())
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    getVersoes().then(rows => {
      if (!active) return
      setData(rows)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = fonte === 'todas' ? data : data.filter(v => v.fonte === fonte)

  const totalEmop = data.filter(v => v.fonte === 'emop').length
  const totalSinapi = data.filter(v => v.fonte === 'sinapi').length

  async function handleDelete(v: ReferenciaVersaoComContagem) {
    if (!confirm(`Excluir a versão ${v.fonte.toUpperCase()} ${meses[v.mes]}/${v.ano} e todos os seus itens?`)) return
    const { error } = await deleteVersao(v.id)
    if (error) {
      alert(error)
      return
    }
    fetchData()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tabelas de Referência</h1>
          <p className="text-gray-400 text-sm">
            EMOP e SINAPI — preços e composições oficiais, versionados por mês/ano.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={() => setOpenImport(true)}>
          <Upload size={15} /> Importar tabela
        </Btn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Versões importadas" value={data.length} variant="neutral" />
        <KpiCard label="EMOP" value={totalEmop} variant="blue" />
        <KpiCard label="SINAPI" value={totalSinapi} variant="green" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filtros.map(f => (
          <button
            key={f.value}
            onClick={() => setFonte(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              fonte === f.value
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            data.length === 0
              ? 'Nenhuma tabela importada ainda. Clique em "Importar tabela".'
              : 'Nenhuma versão para este filtro.'
          }
        />
      ) : (
        <TableCard>
          <table className="w-full">
            <TableHead>
              <Th>Fonte</Th>
              <Th>Período</Th>
              <Th>UF</Th>
              <Th>Rótulo</Th>
              <Th right>Itens</Th>
              <Th right>Ações</Th>
            </TableHead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${fonteBadge[v.fonte]}`}
                    >
                      {v.fonte.toUpperCase()}
                    </span>
                  </td>
                  <Td mono>
                    {meses[v.mes]}/{v.ano}
                  </Td>
                  <Td muted>{v.uf || '—'}</Td>
                  <Td muted>{v.rotulo || '—'}</Td>
                  <Td right mono>
                    {v.total_itens}
                  </Td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setVerItens(v)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                        title="Ver itens"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                        title="Excluir versão"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {openImport && (
        <ImportarReferenciaModal
          onClose={() => setOpenImport(false)}
          onSaved={() => {
            setOpenImport(false)
            fetchData()
          }}
        />
      )}

      {verItens && <ReferenciaItensModal versao={verItens} onClose={() => setVerItens(null)} />}
    </div>
  )
}
