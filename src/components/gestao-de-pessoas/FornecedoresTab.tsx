'use client'

import { useEffect, useState } from 'react'
import { Truck, Star, CheckCircle, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Fornecedor } from '@/types/pessoa'
import { StatsCard } from './shared/StatsCard'
import { SearchBar } from './shared/SearchBar'
import { StatusBadge } from './shared/StatusBadge'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { FornecedorModal } from './FornecedorModal'

const statusFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'homologado', label: 'Homologados' },
  { value: 'suspenso', label: 'Suspensos' },
  { value: 'inativo', label: 'Inativos' },
]

function StarRating({ value }: { value?: number }) {
  if (!value) return <span className="text-gray-600 text-xs">—</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={12} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
      ))}
    </div>
  )
}

export default function FornecedoresTab() {
  const [data, setData] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<Fornecedor | null>(null)

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase.from('fornecedores').select('*').order('created_at', { ascending: false })
    if (!error) setData(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.categoria?.toLowerCase().includes(search.toLowerCase()) ||
      f.contato_nome?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const ativos = data.filter(f => f.status === 'ativo' || f.status === 'homologado').length
  const homologados = data.filter(f => f.status === 'homologado').length
  const mediaAvaliacao = data.filter(f => f.avaliacao).reduce((s, f, _, arr) => s + (f.avaliacao || 0) / arr.length, 0)

  async function handleDelete(id: string) {
    if (!confirm('Excluir fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Total" value={data.length} icon={Truck} iconColor="text-amber-400" iconBg="bg-amber-500/10" />
        <StatsCard label="Ativos/Homologados" value={ativos} icon={CheckCircle} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <StatsCard label="Homologados" value={homologados} icon={Star} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard label="Avaliação média" value={mediaAvaliacao ? `${mediaAvaliacao.toFixed(1)} ★` : '—'} icon={AlertCircle} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === f.value ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'}`}
            >{f.label}</button>
          ))}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-60"><SearchBar placeholder="Buscar fornecedor..." value={search} onChange={setSearch} /></div>
          <button onClick={() => { setSelected(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0"
          ><Plus size={15} /> Novo</button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm py-10 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhum fornecedor encontrado" description="Cadastre seus fornecedores e parceiros" action={
          <button onClick={() => { setSelected(null); setOpenModal(true) }} className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium"><Plus size={14} /> Adicionar fornecedor</button>
        } />
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Fornecedor</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Contato</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Avaliação</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs text-gray-600 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={f.nome} />
                      <div>
                        <p className="text-white font-medium">{f.nome}</p>
                        {f.cnpj && <p className="text-xs text-gray-600 mt-0.5">{f.cnpj}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{f.categoria || '—'}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div>
                      <p className="text-gray-300">{f.contato_nome || '—'}</p>
                      {f.telefone && <p className="text-xs text-gray-600 mt-0.5">{f.telefone}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell"><StarRating value={f.avaliacao} /></td>
                  <td className="px-5 py-4"><StatusBadge status={f.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelected(f); setOpenModal(true) }} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(f.id)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal && (
        <FornecedorModal fornecedor={selected} onClose={() => { setOpenModal(false); setSelected(null) }} onSave={() => { fetchData(); setOpenModal(false); setSelected(null) }} />
      )}
    </div>
  )
}
