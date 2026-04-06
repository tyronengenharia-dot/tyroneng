'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Propostas',     href: '/propostas' },
  { label: 'Nova Proposta', href: '/propostas/nova' },
  { label: 'Contratos',     href: '/propostas/contratos' },
]

export function PropostaTabs() {
  const pathname = usePathname()

  const isRaiz      = pathname === '/propostas'
  const isNova      = pathname.startsWith('/propostas/nova')
  const isContratos = pathname.startsWith('/propostas/contratos')
  const isDetalhe   = !isRaiz && !isNova && !isContratos
  const isEditar    = pathname.includes('/editar')

  function isActive(href: string) {
    if (href === '/propostas')           return isRaiz
    if (href === '/propostas/nova')      return isNova
    if (href === '/propostas/contratos') return isContratos
    return false
  }

  return (
    <div className="flex items-center gap-0 border-b border-zinc-800 mb-6">
      {TABS.map(tab => {
        const active = isActive(tab.href)
        return (
          <Link key={tab.href} href={tab.href}>
            <div className={`
              relative px-4 py-2.5 text-sm font-medium transition-colors duration-150
              ${active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}
            `}>
              {tab.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-px bg-amber-500" />}
            </div>
          </Link>
        )
      })}

      {isDetalhe && (
        <div className="relative px-4 py-2.5 text-sm font-medium text-zinc-100">
          {isEditar ? 'Editando Proposta' : 'Detalhe da Proposta'}
          <span className="absolute bottom-0 left-0 right-0 h-px bg-amber-500" />
        </div>
      )}
    </div>
  )
}