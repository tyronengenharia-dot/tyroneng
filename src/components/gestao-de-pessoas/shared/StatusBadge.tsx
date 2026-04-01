'use client'

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  ativo:        { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inativo:      { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  ferias:       { bg: 'bg-sky-500/10',     text: 'text-sky-400',     dot: 'bg-sky-400' },
  afastado:     { bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  prospecto:    { bg: 'bg-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-400' },
  ex_cliente:   { bg: 'bg-gray-500/10',    text: 'text-gray-400',    dot: 'bg-gray-400' },
  homologado:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  suspenso:     { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  pessoa_fisica:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  pessoa_juridica: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-400' },
}

const labels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  ferias: 'Férias',
  afastado: 'Afastado',
  prospecto: 'Prospecto',
  ex_cliente: 'Ex-cliente',
  homologado: 'Homologado',
  suspenso: 'Suspenso',
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {labels[status] ?? status}
    </span>
  )
}
