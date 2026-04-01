'use client'

import { useState } from 'react'
import { EstoqueTabs } from '@/components/estoque/EstoqueTabs'
import { EstoqueHeader } from '@/components/estoque/EstoqueHeader'

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState('materiais')

  return (
    <div className="p-6 text-white bg-[#0f0f0f] min-h-screen">
      <EstoqueHeader />

      <EstoqueTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  )
}