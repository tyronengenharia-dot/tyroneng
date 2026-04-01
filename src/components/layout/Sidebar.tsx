'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const menu = [
  { name: 'Início', href: '/' },
  { name: 'Agenda', href: '/agenda' },
  { name: 'Financeiro', href: '/financeiro' },
  { name: 'Folha de Pagamento', href: '/folha' },
  { name: 'Funcionários', href: '/funcionarios' },
  { name: 'Obras', href: '/obras' },
  { name: 'Contratos', href: '/contratos' },
  { name: 'Notas Fiscais', href: '/notas-fiscais' },
  { name: 'Documentos', href: '/documentos' },
  { name: 'Relatórios', href: '/relatorios' },
  { name: 'Comparação', href: '/comparacao' },
  { name: 'Auditoria', href: '/auditoria' },

]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-[#0f0f0f] border-r border-white/10 border-r p-5 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-6">Tyron Engenharia</h1>

        <nav className="space-y-2">
          {menu.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-3 rounded-xl transition ${
                pathname === item.href
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <ThemeToggle />
    </aside>
  )
}