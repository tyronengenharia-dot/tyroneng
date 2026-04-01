import { FileText, Users, AlertTriangle, Clock, FolderOpen } from 'lucide-react'
import type { AcervoStats } from '@/types/acervo'

interface StatsGridProps {
  stats: AcervoStats
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      label: 'Total de Documentos',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'text-[#c8f65d]',
      bg: 'bg-[#c8f65d]/10',
      border: 'border-[#c8f65d]/20',
    },
    {
      label: 'Profissionais',
      value: stats.totalProfessionals,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'A Vencer (30d)',
      value: stats.expiringSoon,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Vencidos',
      value: stats.expired,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      label: 'Upload Pendente',
      value: stats.pendingUpload,
      icon: FolderOpen,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className={`rounded-xl p-4 border ${card.bg} ${card.border} flex flex-col gap-3`}
        >
          <div className={`w-8 h-8 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
            <card.icon size={16} className={card.color} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
