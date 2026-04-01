'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/compras' },
  { name: 'Solicitações', href: '/compras/solicitacoes' },
  { name: 'Cotações', href: '/compras/cotacoes' },
  { name: 'Pedidos', href: '/compras/pedidos' },
  { name: 'Entregas', href: '/compras/entregas' },
  { name: 'Auditoria', href: '/compras/auditoria' }
]

export function ComprasTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 border-b border-zinc-800 mb-6">
      {tabs.map((tab) => {
        const active = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              px-4 py-2 text-sm rounded-t-lg transition-all
              ${active
                ? 'bg-zinc-900 text-white border border-b-0 border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }
            `}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}