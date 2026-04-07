'use client'

import { useState } from 'react'
import { Users, Briefcase, Truck, Shield, Star } from 'lucide-react'
import FuncionariosTab from '@/components/gestao-de-pessoas/FuncionariosTab'
import ClientesTab from '@/components/gestao-de-pessoas/ClientesTab'
import FornecedoresTab from '@/components/gestao-de-pessoas/FornecedoresTab'
import AutoridadesTab from '@/components/gestao-de-pessoas/AutoridadesTab'
import PessoasProximasTab from '@/components/gestao-de-pessoas/PessoasProximasTab'

const tabs = [
  { id: 'funcionarios', label: 'Funcionários', icon: Users, color: 'text-blue-400' },
  { id: 'clientes', label: 'Clientes', icon: Briefcase, color: 'text-emerald-400' },
  { id: 'fornecedores', label: 'Fornecedores', icon: Truck, color: 'text-amber-400' },
  { id: 'autoridades', label: 'Autoridades', icon: Shield, color: 'text-purple-400' },
  { id: 'pessoas_proximas', label: 'Pessoas Próximas', icon: Star, color: 'text-rose-400' },
]

export default function GestaoDePessoasPage() {
  const [activeTab, setActiveTab] = useState('funcionarios')

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Pessoas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie toda a sua rede de contatos e equipe
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-white/8 rounded-2xl p-1.5 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-[#1a1a1a] text-white shadow-lg border border-white/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'
                }
              `}
            >
              <Icon size={14} className={isActive ? tab.color : ''} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === 'funcionarios' && <FuncionariosTab />}
        {activeTab === 'clientes' && <ClientesTab />}
        {activeTab === 'fornecedores' && <FornecedoresTab />}
        {activeTab === 'autoridades' && <AutoridadesTab />}
        {activeTab === 'pessoas_proximas' && <PessoasProximasTab />}
      </div>
    </div>
  )
}