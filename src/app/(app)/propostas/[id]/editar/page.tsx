'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Proposta } from '@/types/proposta'
import { PropostaForm }    from '@/components/propostas/PropostaForm'
import { PropostaPreview } from '@/components/propostas/PropostaPreview'

type Step = 'form' | 'preview'

export default function EditarPropostaPage() {
  const router  = useRouter()
  const params  = useParams<{ id: string }>()

  const [original, setOriginal] = useState<Proposta | null>(null)
  const [preview, setPreview]   = useState<Proposta | null>(null)
  const [step, setStep]         = useState<Step>('form')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Carrega proposta existente
  useEffect(() => {
    fetch(`/api/propostas/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error('Proposta não encontrada')
        return r.json()
      })
      .then((data: Proposta) => {
        setOriginal(data)
        setPreview(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [params.id])

  function handleGenerate(data: Proposta) {
    // Mantém o id original para o PATCH funcionar
    setPreview({ ...data, id: params.id, createdAt: original?.createdAt ?? data.createdAt })
    setStep('preview')
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/propostas/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erro ${res.status}`)
      }
      router.push(`/propostas/${params.id}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (error && !original) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-zinc-400 text-sm">{error}</p>
        <button onClick={() => router.push('/propostas')}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
          Voltar às propostas
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">

      {/* Formulário */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Editando Proposta <span className="text-amber-500 font-mono">#{original?.numero}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Altere os campos e clique em Gerar Proposta para ver o preview.
            </p>
          </div>
          {step === 'preview' && (
            <button onClick={() => setStep('form')}
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
              ← Editar
            </button>
          )}
        </div>

        {step === 'form' ? (
          <PropostaForm
            onSubmit={handleGenerate}
            initialData={preview ?? original ?? undefined}
          />
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 text-2xl">✎</div>
            <p className="text-sm font-medium text-zinc-200">Proposta atualizada</p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Revise o preview ao lado e clique em{' '}
              <span className="text-amber-400">Salvar Alterações</span>{' '}
              para confirmar.
            </p>
            <button onClick={() => setStep('form')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1 underline underline-offset-2">
              Continuar editando
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="xl:sticky xl:top-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-400 font-medium">Preview</p>
            <span className="text-[11px] font-mono text-zinc-600">
              {step === 'preview' ? 'com alterações' : 'versão atual'}
            </span>
          </div>

          {preview ? (
            <div className="p-4">
              <PropostaPreview data={preview} />

              {error && (
                <div className="mt-3 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-lg">
                  <p className="text-[11px] text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => router.push(`/propostas/${params.id}`)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving || step === 'form'}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {saving
                    ? <><Spin /> Salvando...</>
                    : step === 'form'
                      ? 'Gere o preview →'
                      : 'Salvar Alterações →'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-zinc-600">Sem dados para exibir</p>
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
