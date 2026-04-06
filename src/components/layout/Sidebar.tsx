'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const menu = [
  { name: 'Início',              href: '/',                icon: '⌂' },
  { name: 'Agenda',              href: '/agenda',          icon: '📅' },
  { name: 'Financeiro',          href: '/financeiro',      icon: '💰' },
  { name: 'Gestão de Pessoas',   href: '/gestao-de-pessoas', icon: '👥' },
  { name: 'Obras',               href: '/obras',           icon: '🏗️' },
  { name: 'Licitações',          href: '/licitacao',       icon: '📋' },
  { name: 'Documentos Gerais',   href: '/acervotecnico',   icon: '📁' },
  { name: 'Propostas e Contratos', href: '/propostas',     icon: '📝' },
  { name: 'Estoque da Empresa',  href: '/estoque',         icon: '📦' },
  { name: 'Compras',             href: '/compras',         icon: '🛒' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={`h-screen bg-[#0f0f0f] border-r border-white/10 flex flex-col justify-between transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top: logo + toggle */}
      <div>
        <div className={`flex items-center p-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <h1 className="text-base font-bold text-white truncate">Tyron Engenharia</h1>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="text-white/40 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="p-2 space-y-1 mt-1">
          {menu.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  active
                    ? 'bg-white text-black font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom: logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="text-base flex-shrink-0">⎋</span>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}