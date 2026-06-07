'use client'

import { useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Select } from '@/components/ui'
import { cn } from '@/lib/utils'

// Bloco reutilizável "conta + comprovante" para os modais de pagamento/recebimento.
// Regra do caixa unificado: toda movimentação realizada nasce numa conta bancária
// e precisa de comprovante. Quando `required`, o pai deve bloquear o submit
// enquanto `contaId` ou o comprovante estiverem vazios (helper `faltaContaOuComprovante`).

type UploadResult = { url: string; path: string }

type Props = {
  contas: { id: string; nome: string }[]
  contaId: string | null
  onContaChange: (id: string | null) => void
  comprovanteUrl: string | null
  comprovantePath: string | null
  onComprovanteChange: (r: { url: string | null; path: string | null }) => void
  upload: (file: File) => Promise<UploadResult>
  removeStored: (path: string) => Promise<void>
  required?: boolean
  disabled?: boolean
  contaLabel?: string
}

export function faltaContaOuComprovante(
  contaId: string | null,
  comprovanteUrl: string | null,
): boolean {
  return !contaId || !comprovanteUrl
}

export function ContaComprovanteFields({
  contas,
  contaId,
  onContaChange,
  comprovanteUrl,
  comprovantePath,
  onComprovanteChange,
  upload,
  removeStored,
  required = false,
  disabled = false,
  contaLabel = 'Conta bancária',
}: Props) {
  const [busy, setBusy] = useState(false)

  const isImg = !!comprovanteUrl && !/\.pdf($|\?)/i.test(comprovanteUrl)

  async function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf'
    if (!ok) {
      toast.error('Envie uma imagem ou PDF do comprovante.')
      return
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 8 MB).')
      return
    }
    setBusy(true)
    try {
      const up = await upload(f)
      if (comprovantePath) await removeStored(comprovantePath)
      onComprovanteChange({ url: up.url, path: up.path })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload do comprovante')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!comprovantePath) {
      onComprovanteChange({ url: null, path: null })
      return
    }
    setBusy(true)
    try {
      await removeStored(comprovantePath)
    } finally {
      setBusy(false)
      onComprovanteChange({ url: null, path: null })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Select
        label={`${contaLabel}${required ? ' *' : ''}`}
        value={contaId ?? ''}
        disabled={disabled}
        onChange={e => onContaChange(e.target.value || null)}
        options={[
          { value: '', label: 'Selecione a conta…' },
          ...contas.map(c => ({ value: c.id, label: c.nome })),
        ]}
      />

      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">
          Comprovante {required && <span className="text-red-400">*</span>}
        </label>

        {comprovanteUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={comprovanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 min-w-0"
              title="Ver comprovante"
            >
              {isImg ? (
                <img
                  src={comprovanteUrl}
                  alt="comprovante"
                  className="h-9 w-9 object-cover rounded-lg border border-white/10"
                />
              ) : (
                <span className="h-9 w-9 grid place-items-center rounded-lg border border-white/10 text-[10px] text-white/50">
                  PDF
                </span>
              )}
              <span className="text-xs text-blue-400/80 truncate">ver comprovante</span>
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="text-red-400/60 hover:text-red-400 text-xs"
                title="Remover comprovante"
              >
                remover
              </button>
            )}
          </div>
        ) : (
          <label
            className={cn(
              'flex items-center justify-center gap-2 w-full bg-white/5 border border-dashed border-white/15 rounded-xl px-4 py-2.5 text-sm transition-colors',
              disabled
                ? 'opacity-50 cursor-not-allowed text-white/30'
                : 'cursor-pointer text-white/50 hover:border-white/30 hover:text-white/80',
            )}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={disabled || busy}
              onChange={handlePick}
            />
            {busy ? 'Enviando…' : '+ anexar comprovante'}
          </label>
        )}
      </div>
    </div>
  )
}
