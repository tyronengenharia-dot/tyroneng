'use client'

import { useEffect, useState } from 'react'
import { Briefcase, UserCheck, Users, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Cliente } from '@/types/pessoa'
import { StatsCard } from './shared/StatsCard'
import { SearchBar } from './shared/SearchBar'
import { StatusBadge } from './shared/StatusBadge'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { ClienteModal } from './ClienteModal'

const statusFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'prospecto', label: 'Prospectos' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'ex_cliente', label: 'Ex-clientes' },
]

export default function ClientesTab() {
  const [data, setData] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setData(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const ativos = data.filter(c => c.status === 'ativo').length
  const prospectos = data.filter(c => c.status === 'prospecto').length
  const pj = data.filter(c => c.tipo === 'pessoa_juridica').length

  async function handleDelete(id: string) {
    if (!confirm('Excluir cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Total" value={data.length} icon={Users} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <StatsCard label="Ativos" value={ativos} icon={UserCheck} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard label="Prospectos" value={prospectos} icon={TrendingUp} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <StatsCard label="Pessoa Jurídica" value={pj} icon={Briefcase} iconColor="text-amber-400" iconBg="bg-amber-500/10" />
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
            <SearchBar placeholder="Buscar cliente..." value={search} onChange={setSearch} />
          </div>
          <button
            onClick={() => { setSelected(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Plus size={15} /> Novo
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-gray-600 text-sm py-10 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum cliente encontrado"
          description="Cadastre seus clientes para gerenciar o relacionamento"
          action={
            <button
              onClick={() => { setSelected(null); setOpenModal(true) }}
              className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              <Plus size={14} /> Adicionar cliente
            </button>
          }
        />
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Empresa</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Cidade</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs text-gray-600 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.nome} />
                      <div>
                        <p className="text-white font-medium">{c.nome}</p>
                        {c.email && <p className="text-xs text-gray-600 mt-0.5">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{c.empresa || '—'}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <StatusBadge status={c.tipo} />
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">{c.cidade || '—'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setSelected(c); setOpenModal(true) }}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
        <ClienteModal
          cliente={selected}
          onClose={() => { setOpenModal(false); setSelected(null) }}
          onSave={() => { fetchData(); setOpenModal(false); setSelected(null) }}
        />
      )}
    </div>
  )
}
