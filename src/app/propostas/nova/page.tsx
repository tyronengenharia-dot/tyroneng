'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Proposta } from '@/types/proposta'
import { PropostaForm } from '@/components/propostas/PropostaForm'
import { PropostaPreview } from '@/components/propostas/PropostaPreview'

const EMPTY_PREVIEW: Proposta = {
  id: '__preview__',
  numero: '—',
  cliente: '—',
  obra: '—',
  descricao: '',
  etapas: [],
  valor: 0,
  prazoExecucao: 0,
  validade: 0,
  responsavel: 'Rodrigo Antunes Ramos',
  crea: 'CREA/RJ 2019103029',
  condicoesPagamento: '',
  status: 'rascunho',
  createdAt: new Date().toISOString(),
}

export default function NovaPropostaPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<Proposta | null>(null)
  const [saving, setSaving] = useState(false)

  function handleGenerate(data: Proposta) {
    setPreview(data)
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    // TODO: POST para /api/propostas
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    router.push('/propostas')
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
      {/* Formulário */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <p className="text-sm font-medium text-zinc-200 mb-1">
          Dados da Proposta
        </p>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          Preencha os campos abaixo. A proposta será gerada no modelo padrão da
          Tyron Engenharia.
        </p>
        <PropostaForm onSubmit={handleGenerate} />
      </div>

      {/* Preview */}
      <div className="xl:sticky xl:top-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Preview header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-400 font-medium tracking-wide">
              Preview da Proposta
            </p>
            <span className="text-[11px] font-mono text-zinc-600">
              {preview ? 'gerada' : 'aguardando dados'}
            </span>
          </div>

          {!preview ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 text-lg">
                ◧
              </div>
              <p className="text-sm text-zinc-600 text-center leading-relaxed">
                Preencha os campos e clique em{' '}
                <span className="text-amber-600">Gerar Proposta</span>
              </p>
            </div>
          ) : (
            <div className="p-4">
              <PropostaPreview data={preview} />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 disabled:opacity-60 transition-all"
                >
                  {saving ? 'Salvando…' : 'Salvar Proposta →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
