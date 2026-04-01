'use client'

import { useEffect, useState } from 'react'
import { Shield, Building2, MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Autoridade } from '@/types/pessoa'
import { StatsCard } from './shared/StatsCard'
import { SearchBar } from './shared/SearchBar'
import { StatusBadge } from './shared/StatusBadge'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { AutoridadeModal } from './AutoridadeModal'

export default function AutoridadesTab() {
  const [data, setData] = useState<Autoridade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<Autoridade | null>(null)

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase.from('autoridades').select('*').order('created_at', { ascending: false })
    if (!error) setData(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.orgao?.toLowerCase().includes(search.toLowerCase()) ||
    a.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  const orgaos = [...new Set(data.map(a => a.orgao).filter(Boolean))].length
  const ativos = data.filter(a => a.status === 'ativo').length

  async function handleDelete(id: string) {
    if (!confirm('Excluir autoridade?')) return
    await supabase.from('autoridades').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard label="Total de contatos" value={data.length} icon={Shield} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatsCard label="Ativos" value={ativos} icon={Building2} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard label="Órgãos distintos" value={orgaos} icon={MapPin} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
      </div>

      <div className="flex gap-3 items-center justify-between">
        <div className="flex-1 max-w-sm">
          <SearchBar placeholder="Buscar autoridade, órgão..." value={search} onChange={setSearch} />
        </div>
        <button onClick={() => { setSelected(null); setOpenModal(true) }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
        ><Plus size={15} /> Novo</button>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm py-10 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhuma autoridade cadastrada" description="Gerencie seus contatos em órgãos públicos e regulatórios" action={
          <button onClick={() => { setSelected(null); setOpenModal(true) }} className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium"><Plus size={14} /> Adicionar autoridade</button>
        } />
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Órgão</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Cargo</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Jurisdição</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs text-gray-600 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.nome} />
                      <div>
                        <p className="text-white font-medium">{a.nome}</p>
                        {a.email && <p className="text-xs text-gray-600 mt-0.5">{a.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{a.orgao || '—'}</td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{a.cargo || '—'}</td>
                  <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">{a.jurisdicao || '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelected(a); setOpenModal(true) }} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(a.id)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal && (
        <AutoridadeModal autoridade={selected} onClose={() => { setOpenModal(false); setSelected(null) }} onSave={() => { fetchData(); setOpenModal(false); setSelected(null) }} />
      )}
    </div>
  )
}
