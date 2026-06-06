'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ServicoComCusto } from '@/types/servico'
import { getServicos, deleteServico } from '@/services/servicoService'
import { ServicoModal } from '@/components/servicos/ServicoModal'
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

type AtivoFiltro = 'todos' | 'ativos' | 'inativos'

const filtros: { value: AtivoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
]

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ServicosPage() {
  const [data, setData] = useState<ServicoComCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ativoFiltro, setAtivoFiltro] = useState<AtivoFiltro>('todos')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<ServicoComCusto | null>(null)

  async function fetchData() {
    setLoading(true)
    setData(await getServicos())
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    getServicos().then(rows => {
      if (!active) return
      setData(rows)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = data.filter(s => {
    const q = search.toLowerCase()
    const matchSearch =
      s.codigo.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q)
    const matchAtivo =
      ativoFiltro === 'todos' ||
      (ativoFiltro === 'ativos' && s.ativo) ||
      (ativoFiltro === 'inativos' && !s.ativo)
    return matchSearch && matchAtivo
  })

  const ativos = data.filter(s => s.ativo).length
  const custoMedio = data.length ? data.reduce((sum, s) => sum + s.custo_unitario, 0) / data.length : 0

  async function handleDelete(servico: ServicoComCusto) {
    if (!confirm(`Excluir o serviço "${servico.codigo} — ${servico.descricao}"?`)) return
    const { error } = await deleteServico(servico.id)
    if (error) {
      alert(error)
      return
    }
    fetchData()
  }

  function openNew() {
    setSelected(null)
    setOpenModal(true)
  }
  function openEdit(s: ServicoComCusto) {
    setSelected(s)
    setOpenModal(true)
  }
  function closeModal() {
    setOpenModal(false)
    setSelected(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tabela de Serviços</h1>
          <p className="text-gray-400 text-sm">
            Composições da empresa. O custo unitário é derivado dos insumos que compõem cada serviço.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={openNew}>
          <Plus size={15} /> Novo serviço
        </Btn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Total de serviços" value={data.length} variant="neutral" />
        <KpiCard label="Ativos" value={ativos} variant="blue" />
        <KpiCard label="Custo unitário médio" value={formatCurrency(custoMedio)} variant="green" />
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filtros.map(f => (
            <button
              key={f.value}
              onClick={() => setAtivoFiltro(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                ativoFiltro === f.value
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código ou descrição..."
          className="w-full sm:w-72 bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Conteúdo */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            data.length === 0
              ? 'Nenhum serviço cadastrado ainda. Clique em "Novo serviço".'
              : 'Nenhum serviço encontrado para este filtro.'
          }
        />
      ) : (
        <TableCard>
          <table className="w-full">
            <TableHead>
              <Th>Código</Th>
              <Th>Descrição</Th>
              <Th>Unidade</Th>
              <Th right>Custo unitário</Th>
              <Th>Situação</Th>
              <Th right>Ações</Th>
            </TableHead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <Td mono>{s.codigo}</Td>
                  <Td>{s.descricao}</Td>
                  <Td muted>{s.unidade}</Td>
                  <Td right mono>
                    <span className="text-green-400">{formatCurrency(s.custo_unitario)}</span>
                  </Td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <span className={`text-xs ${s.ativo ? 'text-green-400' : 'text-white/30'}`}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                        title="Excluir"
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

      {openModal && (
        <ServicoModal
          servico={selected}
          onClose={closeModal}
          onSaved={() => {
            closeModal()
            fetchData()
          }}
        />
      )}
    </div>
  )
}
