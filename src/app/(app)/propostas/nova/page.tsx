'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Proposta } from '@/types/proposta'
import { PropostaForm } from '@/components/propostas/PropostaForm'
import { PropostaPreview } from '@/components/propostas/PropostaPreview'

type Step = 'form' | 'preview'

export default function NovaPropostaPage() {
  const router = useRouter()

  const [step, setStep]       = useState<Step>('form')
  const [preview, setPreview] = useState<Proposta | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function handleGenerate(data: Proposta) {
    setPreview(data)
    setStep('preview')
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erro ${res.status}`)
      }
      router.push('/propostas')
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">

      {/* Formulário */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-zinc-200">Dados da Proposta</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cada seção corresponde a uma página do PDF final.
            </p>
          </div>
          {step === 'preview' && (
            <button onClick={() => setStep('form')}
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
              ← Editar
            </button>
          )}
        </div>

        {step === 'form'
          ? <PropostaForm onSubmit={handleGenerate} initialData={preview ?? undefined} />
          : (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 text-2xl">✓</div>
              <p className="text-sm font-medium text-zinc-200">Proposta gerada!</p>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                Revise o preview ao lado. Clique em{' '}
                <span className="text-amber-400">Salvar Proposta</span>{' '}
                para registrar no sistema.
              </p>
              <button onClick={() => setStep('form')}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1 underline underline-offset-2">
                Voltar e editar dados
              </button>
            </div>
          )}
      </div>

      {/* Preview */}
      <div className="xl:sticky xl:top-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-400 font-medium">Preview</p>
            <span className={`text-[11px] font-mono ${preview ? 'text-emerald-500' : 'text-zinc-600'}`}>
              {preview ? 'pronta para salvar' : 'aguardando dados'}
            </span>
          </div>

          {!preview ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 text-xl">◧</div>
              <p className="text-sm text-zinc-600 text-center">
                Preencha e clique em <span className="text-amber-500">Gerar Proposta</span>
              </p>
            </div>
          ) : (
            <div className="p-4">
              <PropostaPreview data={preview} />
              {error && (
                <div className="mt-3 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-lg">
                  <p className="text-[11px] text-red-400">{error}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep('form')} disabled={saving}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50 transition-colors">
                  Editar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {saving ? <><Spin /> Salvando...</> : 'Salvar Proposta →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Spin() {
  return <span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-950 rounded-full animate-spin" />
}
