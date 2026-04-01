'use client'

import { useEffect, useState } from 'react'
import { Users, DollarSign, UserCheck, UserX, Plus, MoreHorizontal, Pencil, Trash2, Calculator } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Funcionario } from '@/types/pessoa'
import { StatsCard } from './shared/StatsCard'
import { SearchBar } from './shared/SearchBar'
import { StatusBadge } from './shared/StatusBadge'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { FuncionarioModal } from './FuncionarioModal'
import { FuncionarioCustosModal } from './FuncionarioCustosModal'

const statusFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'ferias', label: 'Férias' },
  { value: 'afastado', label: 'Afastado' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function FuncionariosTab() {
  const [data, setData] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [openModal, setOpenModal] = useState(false)
  const [openCustos, setOpenCustos] = useState(false)
  const [selected, setSelected] = useState<Funcionario | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setData(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.cargo?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const ativos = data.filter(f => f.status === 'ativo').length
  const inativos = data.filter(f => f.status === 'inativo').length
  const totalFolha = data.filter(f => f.status === 'ativo').reduce((s, f) => s + (f.custo_total || f.salario || 0), 0)

  async function handleDelete(id: string) {
    if (!confirm('Excluir funcionário?')) return
    await supabase.from('funcionarios').delete().eq('id', id)
    fetchData()
  }

  async function toggleStatus(f: Funcionario) {
    const next = f.status === 'ativo' ? 'inativo' : 'ativo'
    await supabase.from('funcionarios').update({ status: next }).eq('id', f.id)
    fetchData()
  }

  return (
    <div className="space-y-6" onClick={() => setOpenMenu(null)}>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Total" value={data.length} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard label="Ativos" value={ativos} icon={UserCheck} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <StatsCard label="Inativos" value={inativos} icon={UserX} iconColor="text-red-400" iconBg="bg-red-500/10" />
        <StatsCard label="Folha ativa" value={formatCurrency(totalFolha)} icon={DollarSign} iconColor="text-amber-400" iconBg="bg-amber-500/10" sub="custo total mensal" />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-60">
            <SearchBar placeholder="Buscar funcionário..." value={search} onChange={setSearch} />
          </div>
          <button
            onClick={() => { setSelected(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Plus size={15} />
            Novo
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-gray-600 text-sm py-10 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum funcionário encontrado"
          description="Adicione o primeiro funcionário da sua equipe"
          action={
            <button
              onClick={() => { setSelected(null); setOpenModal(true) }}
              className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              <Plus size={14} /> Adicionar funcionário
            </button>
          }
        />
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Funcionário</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Cargo</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Salário</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Custo Total</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs text-gray-600 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={f.nome} photoUrl={f.foto_url} />
                      <div>
                        <p className="text-white font-medium">{f.nome}</p>
                        {f.email && <p className="text-xs text-gray-600 mt-0.5">{f.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{f.cargo || '—'}</td>
                  <td className="px-5 py-4 text-gray-300 hidden lg:table-cell">{formatCurrency(f.salario)}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {f.custo_total ? (
                      <span className="text-white font-medium">{formatCurrency(f.custo_total)}</span>
                    ) : (
                      <span className="text-gray-600 text-xs">Não calculado</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleStatus(f)}>
                      <StatusBadge status={f.status} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        title="Calcular custos"
                        onClick={() => { setSelected(f); setOpenCustos(true) }}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-amber-400 transition-colors"
                      >
                        <Calculator size={14} />
                      </button>
                      <button
                        title="Editar"
                        onClick={() => { setSelected(f); setOpenModal(true) }}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => handleDelete(f.id)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal && (
        <FuncionarioModal
          funcionario={selected}
          onClose={() => { setOpenModal(false); setSelected(null) }}
          onSave={() => { fetchData(); setOpenModal(false); setSelected(null) }}
        />
      )}

      {openCustos && selected && (
        <FuncionarioCustosModal
          funcionario={selected}
          onClose={() => { setOpenCustos(false); setSelected(null) }}
          onSaved={() => { fetchData(); setOpenCustos(false); setSelected(null) }}
        />
      )}
    </div>
  )
}
