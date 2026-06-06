'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Insumo, InsumoTipo } from '@/types/insumo'
import { getInsumos, deleteInsumo } from '@/services/insumoService'
import { InsumoModal } from '@/components/insumos/InsumoModal'
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

const tipoLabels: Record<InsumoTipo, string> = {
  material: 'Material',
  mao_de_obra: 'Mão de obra',
  equipamento: 'Equipamento',
}

const tipoBadge: Record<InsumoTipo, string> = {
  material: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mao_de_obra: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  equipamento: 'bg-green-500/10 text-green-400 border-green-500/20',
}

const filtros: { value: 'todos' | InsumoTipo; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'material', label: 'Materiais' },
  { value: 'mao_de_obra', label: 'Mão de obra' },
  { value: 'equipamento', label: 'Equipamentos' },
]

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function InsumosPage() {
  const [data, setData] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState<'todos' | InsumoTipo>('todos')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<Insumo | null>(null)

  async function fetchData() {
    setLoading(true)
    setData(await getInsumos())
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    getInsumos().then(rows => {
      if (!active) return
      setData(rows)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = data.filter(i => {
    const q = search.toLowerCase()
    const matchSearch =
      i.codigo.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q)
    const matchTipo = tipo === 'todos' || i.tipo === tipo
    return matchSearch && matchTipo
  })

  const countByTipo = (t: InsumoTipo) => data.filter(i => i.tipo === t).length

  async function handleDelete(insumo: Insumo) {
    if (!confirm(`Excluir o insumo "${insumo.codigo} — ${insumo.descricao}"?`)) return
    const { error } = await deleteInsumo(insumo.id)
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
  function openEdit(i: Insumo) {
    setSelected(i)
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
          <h1 className="text-2xl font-bold text-white">Tabela de Insumos</h1>
          <p className="text-gray-400 text-sm">
            Catálogo único da empresa — materiais, mão de obra e equipamentos, com código e valor unitário.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={openNew}>
          <Plus size={15} /> Novo insumo
        </Btn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de insumos" value={data.length} variant="neutral" />
        <KpiCard label="Materiais" value={countByTipo('material')} variant="blue" />
        <KpiCard label="Mão de obra" value={countByTipo('mao_de_obra')} variant="amber" />
        <KpiCard label="Equipamentos" value={countByTipo('equipamento')} variant="green" />
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filtros.map(f => (
            <button
              key={f.value}
              onClick={() => setTipo(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                tipo === f.value
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
              ? 'Nenhum insumo cadastrado ainda. Clique em "Novo insumo".'
              : 'Nenhum insumo encontrado para este filtro.'
          }
        />
      ) : (
        <TableCard>
          <table className="w-full">
            <TableHead>
              <Th>Código</Th>
              <Th>Tipo</Th>
              <Th>Descrição</Th>
              <Th>Unidade</Th>
              <Th right>Valor unitário</Th>
              <Th>Situação</Th>
              <Th right>Ações</Th>
            </TableHead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-white/[0.02] transition-colors">
                  <Td mono>{i.codigo}</Td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${tipoBadge[i.tipo]}`}
                    >
                      {tipoLabels[i.tipo]}
                    </span>
                  </td>
                  <Td>{i.descricao}</Td>
                  <Td muted>{i.unidade}</Td>
                  <Td right mono>
                    {formatCurrency(i.valor_unitario)}
                  </Td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <span className={`text-xs ${i.ativo ? 'text-green-400' : 'text-white/30'}`}>
                      {i.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(i)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
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
        <InsumoModal
          insumo={selected}
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
