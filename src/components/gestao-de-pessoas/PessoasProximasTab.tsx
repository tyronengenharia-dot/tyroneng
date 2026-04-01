'use client'

import { useEffect, useState } from 'react'
import { Star, Users, Briefcase, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { PessoaProxima } from '@/types/pessoa'
import { StatsCard } from './shared/StatsCard'
import { SearchBar } from './shared/SearchBar'
import { StatusBadge } from './shared/StatusBadge'
import { Avatar } from './shared/Avatar'
import { EmptyState } from './shared/EmptyState'
import { PessoaProximaModal } from './PessoaProximaModal'

export default function PessoasProximasTab() {
  const [data, setData] = useState<PessoaProxima[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<PessoaProxima | null>(null)

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase.from('pessoas_proximas').select('*').order('created_at', { ascending: false })
    if (!error) setData(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.relacao?.toLowerCase().includes(search.toLowerCase()) ||
    p.empresa?.toLowerCase().includes(search.toLowerCase()) ||
    p.area?.toLowerCase().includes(search.toLowerCase())
  )

  const areas = [...new Set(data.map(p => p.area).filter(Boolean))].length

  async function handleDelete(id: string) {
    if (!confirm('Excluir contato?')) return
    await supabase.from('pessoas_proximas').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard label="Total" value={data.length} icon={Star} iconColor="text-rose-400" iconBg="bg-rose-500/10" />
        <StatsCard label="Ativos" value={data.filter(p => p.status === 'ativo').length} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard label="Áreas distintas" value={areas} icon={Briefcase} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
      </div>

      <div className="flex gap-3 items-center justify-between">
        <div className="flex-1 max-w-sm">
          <SearchBar placeholder="Buscar pessoa, relação, área..." value={search} onChange={setSearch} />
        </div>
        <button onClick={() => { setSelected(null); setOpenModal(true) }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
        ><Plus size={15} /> Novo</button>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm py-10 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Star} title="Nenhuma pessoa próxima cadastrada" description="Gerencie sua rede de relacionamentos e contatos estratégicos" action={
          <button onClick={() => { setSelected(null); setOpenModal(true) }} className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium"><Plus size={14} /> Adicionar contato</button>
        } />
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Pessoa</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Relação</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden md:table-cell">Empresa / Área</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider hidden lg:table-cell">Contato</th>
                <th className="px-5 py-3.5 text-left text-xs text-gray-600 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs text-gray-600 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.nome} />
                      <div>
                        <p className="text-white font-medium">{p.nome}</p>
                        {p.cargo && <p className="text-xs text-gray-600 mt-0.5">{p.cargo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-xs">{p.relacao || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div>
                      <p className="text-gray-300">{p.empresa || '—'}</p>
                      {p.area && <p className="text-xs text-gray-600 mt-0.5">{p.area}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div>
                      {p.telefone && <p className="text-gray-400 text-xs">{p.telefone}</p>}
                      {p.email && <p className="text-gray-600 text-xs mt-0.5">{p.email}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelected(p); setOpenModal(true) }} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal && (
        <PessoaProximaModal pessoa={selected} onClose={() => { setOpenModal(false); setSelected(null) }} onSave={() => { fetchData(); setOpenModal(false); setSelected(null) }} />
      )}
    </div>
  )
}
