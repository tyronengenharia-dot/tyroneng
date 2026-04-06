'use client'

import { cn } from '@/lib/utils'

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'andamento' | 'concluida' | 'atrasada' | 'pago' | 'pendente' | 'atrasado' | 'aprovado' | 'em_analise' | 'neutro'

const badgeStyles: Record<BadgeVariant, string> = {
  andamento:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  concluida:  'bg-green-500/10 text-green-400 border border-green-500/20',
  atrasada:   'bg-red-500/10 text-red-400 border border-red-500/20',
  pago:       'bg-green-500/10 text-green-400 border border-green-500/20',
  pendente:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  atrasado:   'bg-red-500/10 text-red-400 border border-red-500/20',
  aprovado:   'bg-green-500/10 text-green-400 border border-green-500/20',
  em_analise: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  neutro:     'bg-white/5 text-white/40 border border-white/10',
}

const badgeLabels: Record<string, string> = {
  andamento:  'Em andamento',
  concluida:  'Concluída',
  atrasada:   'Atrasada',
  pago:       'Pago',
  pendente:   'Pendente',
  atrasado:   'Atrasado',
  aprovado:   'Aprovado',
  em_analise: 'Em análise',
  entrada:    'Entrada',
  saida:      'Saída',
  em_andamento: 'Em andamento',
  planejada:  'Planejado',
}

export function Badge({ value }: { value: string }) {
  const variant = (badgeStyles[value as BadgeVariant] ? value : 'neutro') as BadgeVariant
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', badgeStyles[variant])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {badgeLabels[value] ?? value}
    </span>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

type KpiVariant = 'blue' | 'green' | 'amber' | 'red' | 'neutral'

const kpiAccent: Record<KpiVariant, string> = {
  blue:    'before:bg-blue-500',
  green:   'before:bg-green-500',
  amber:   'before:bg-amber-500',
  red:     'before:bg-red-500',
  neutral: 'before:bg-white/20',
}

const kpiValueColor: Record<KpiVariant, string> = {
  blue:    'text-blue-400',
  green:   'text-green-400',
  amber:   'text-amber-400',
  red:     'text-red-400',
  neutral: 'text-white',
}

type KpiCardProps = {
  label: string
  value: string | number
  sub?: string
  variant?: KpiVariant
}

export function KpiCard({ label, value, sub, variant = 'neutral' }: KpiCardProps) {
  return (
    <div className={cn(
      'relative bg-[#111] border border-white/[0.08] rounded-2xl p-5 overflow-hidden',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:rounded-t-2xl',
      kpiAccent[variant]
    )}>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{label}</p>
      <p className={cn('text-3xl font-semibold tracking-tight', kpiValueColor[variant])}>{value}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1.5 font-mono">{sub}</p>}
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

type ProgressBarProps = {
  value: number
  max?: number
  className?: string
  color?: 'blue' | 'green' | 'amber' | 'red'
}

const progressColor = {
  blue:  'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
}

export function ProgressBar({ value, max = 100, className, color = 'blue' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={cn('bg-white/5 rounded-full h-1.5 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', progressColor[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function EmptyState({ message = 'Nenhum registro encontrado' }: { message?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-white/30 text-sm">{message}</p>
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────────────────────

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────

type ModalProps = {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ title, subtitle, onClose, children, footer }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg p-1.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }

export function Input({ label, required, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-white/40 mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input className={inputClass} {...props} />
    </div>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-white/40 mb-1.5">{label}</label>
      )}
      <select className={cn(inputClass, 'cursor-pointer')} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const btnVariant = {
  primary: 'bg-white text-black hover:bg-white/90',
  ghost:   'bg-transparent text-white/50 border border-white/10 hover:text-white hover:bg-white/5',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
}

const btnSize = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
}

export function Btn({ variant = 'ghost', size = 'sm', className, children, ...props }: BtnProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-xl transition-colors disabled:opacity-50',
        btnVariant[variant],
        btnSize[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Table Wrapper ─────────────────────────────────────────────────────────────

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
      {children}
    </div>
  )
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/[0.08]">{children}</tr>
    </thead>
  )
}

export function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={cn(
      'px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider',
      right ? 'text-right' : 'text-left'
    )}>
      {children}
    </th>
  )
}

export function Td({ children, right, mono, muted }: {
  children: React.ReactNode
  right?: boolean
  mono?: boolean
  muted?: boolean
}) {
  return (
    <td className={cn(
      'px-5 py-3.5 text-sm border-t border-white/[0.05]',
      right && 'text-right',
      mono && 'font-mono',
      muted ? 'text-white/40' : 'text-white/80'
    )}>
      {children}
    </td>
  )
}
