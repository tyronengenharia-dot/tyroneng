'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Propostas', href: '/propostas' },
  { label: 'Nova Proposta', href: '/propostas/nova' },
]

export function PropostaTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-zinc-800 mb-6">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/propostas'
            ? pathname === '/propostas'
            : pathname.startsWith(tab.href)

        return (
          <Link key={tab.href} href={tab.href}>
            <div
              className={`
                relative px-4 py-2.5 text-sm font-medium transition-colors duration-150
                ${
                  isActive
                    ? 'text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-amber-500" />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
