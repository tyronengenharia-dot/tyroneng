// Shared UI primitives — importar conforme necessário

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  disponivel:  { label: 'Disponível',  className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  ativo:       { label: 'Ativo',       className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  em_uso:      { label: 'Em uso',      className: 'bg-blue-500/10   text-blue-400   border border-blue-500/20'   },
  manutencao:  { label: 'Manutenção',  className: 'bg-amber-500/10  text-amber-400  border border-amber-500/20'  },
  parado:      { label: 'Parado',      className: 'bg-red-500/10    text-red-400    border border-red-500/20'    },
  inativo:     { label: 'Inativo',     className: 'bg-gray-500/10   text-gray-400   border border-gray-500/20'   },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-700 text-gray-300' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 bg-[#111113] border border-gray-800 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all w-64"
      />
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-600">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm">Nenhum {label} encontrado</p>
      <p className="text-gray-700 text-xs mt-1">Clique em "+ Novo" para adicionar</p>
    </div>
  )
}

// ─── TableWrapper ─────────────────────────────────────────────────────────────

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] rounded-2xl border border-gray-800/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  )
}

export function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-gray-800/80">
        {cols.map(col => (
          <th
            key={col}
            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {col}
          </th>
        ))}
        <th className="px-4 py-3" />
      </tr>
    </thead>
  )
}

// ─── ActionMenu ───────────────────────────────────────────────────────────────

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <td className="px-4 py-3">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
          title="Editar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Excluir"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </td>
  )
}

// ─── Modal base ───────────────────────────────────────────────────────────────

export function ModalOverlay({
  title,
  onClose,
  children,
  onSave,
}: {
  title: string
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111113] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">{children}</div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form field helpers ───────────────────────────────────────────────────────

export const inputCls =
  'w-full px-3 py-2 bg-black/40 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all'

export const selectCls =
  'w-full px-3 py-2 bg-black/40 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all'

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-500 mb-1">{children}</label>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}