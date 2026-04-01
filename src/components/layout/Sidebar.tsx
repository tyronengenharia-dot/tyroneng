'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'


const menu = [
  { name: 'Início', href: '/' },
  { name: 'Agenda', href: '/agenda' },
  { name: 'Financeiro', href: '/financeiro' },
  { name: 'Gestão de Pessoas', href: '/gestao-de-pessoas' },
  { name: 'Obras', href: '/obras' },
  { name: 'Contratos', href: '/contratos' },
  { name: 'Documentos', href: '/documentos' },
  { name: 'Relatórios', href: '/relatorios' },
  { name: 'Comparação', href: '/comparacao' },
  { name: 'Auditoria', href: '/auditoria' },
  { name: 'Licitações', href: '/licitacao' },
  { name: 'Acervo Técnico', href: '/acervotecnico' },
  { name: 'Propostas', href: '/propostas' },
  { name: 'Estoque da Empresa', href: '/estoque' },
  { name: 'Compras', href: '/compras' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-[#0f0f0f] border-r border-white/10 p-5 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-6">Tyron Engenharia</h1>

        <nav className="space-y-2">
          {menu.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-3 rounded-xl transition ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>


    </aside>
  )
}