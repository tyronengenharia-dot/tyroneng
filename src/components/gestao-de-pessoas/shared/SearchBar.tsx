'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ placeholder = 'Buscar...', value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          w-full pl-10 pr-4 py-2.5 bg-[#0f0f0f] border border-white/8 rounded-xl text-sm text-white
          placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors
        "
      />
    </div>
  )
}
