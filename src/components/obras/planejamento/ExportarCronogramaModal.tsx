'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getObraById } from '@/services/obraService'
import { exportPlanejamentoPdf, PlanejamentoPdfMode } from '@/lib/exportPlanejamentoPdf'
import { Etapa, Obra } from '@/types'
import { Modal, Btn, Input, Select, LoadingSpinner } from '@/components/ui'

// RT é constante por empresa → guardado global. Contrato é por obra.
const RT_KEY = 'tyron_pdf_rt'
const contratoKey = (obraId: string) => `tyron_pdf_contrato_${obraId}`

function readLS<T>(key: string): Partial<T> {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    return raw ? (JSON.parse(raw) as Partial<T>) : {}
  } catch {
    return {}
  }
}

type Props = {
  obra_id: string
  etapas: Etapa[]
  onClose: () => void
}

export function ExportarCronogramaModal({ obra_id, etapas, onClose }: Props) {
  const [obra, setObra]           = useState<Obra | null>(null)
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [mode, setMode]           = useState<PlanejamentoPdfMode>('completo')
  const [capa, setCapa]           = useState(true)

  const [form, setForm] = useState({
    numero: '', objeto: '', contratante: '', contratada: 'Tyron Engenharia',
    local: '', valor: '', dataAssinatura: '',
    rtNome: '', rtTitulo: 'Engenheiro Civil', crea: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    let active = true
    getObraById(obra_id).then(o => {
      if (!active) return
      const rt = readLS<{ nome: string; titulo: string; crea: string }>(RT_KEY)
      const ct = readLS<Record<string, string>>(contratoKey(obra_id))
      setObra(o)
      setForm(f => ({
        ...f,
        numero:        ct.numero ?? '',
        objeto:        ct.objeto ?? (o?.description || o?.name || ''),
        contratante:   ct.contratante ?? (o?.client || ''),
        contratada:    ct.contratada ?? 'Tyron Engenharia',
        local:         ct.local ?? (o?.location || ''),
        valor:         ct.valor ?? (o?.budget ? String(o.budget) : ''),
        dataAssinatura: ct.dataAssinatura ?? '',
        rtNome:        rt.nome ?? '',
        rtTitulo:      rt.titulo ?? 'Engenheiro Civil',
        crea:          rt.crea ?? '',
      }))
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  async function handleGenerate() {
    if (etapas.length === 0) { toast.error('Nada para exportar — nenhuma etapa cadastrada.'); return }
    setGenerating(true)
    try {
      // Persiste para a próxima exportação (RT global, contrato por obra).
      window.localStorage.setItem(RT_KEY, JSON.stringify({ nome: form.rtNome, titulo: form.rtTitulo, crea: form.crea }))
      window.localStorage.setItem(contratoKey(obra_id), JSON.stringify({
        numero: form.numero, objeto: form.objeto, contratante: form.contratante, contratada: form.contratada,
        local: form.local, valor: form.valor, dataAssinatura: form.dataAssinatura,
      }))

      await exportPlanejamentoPdf({
        obra: { name: obra?.name ?? 'Obra', client: form.contratante || obra?.client, location: form.local || obra?.location },
        etapas,
        mode,
        capa,
        contrato: {
          numero: form.numero || undefined,
          objeto: form.objeto || undefined,
          contratante: form.contratante || undefined,
          contratada: form.contratada || undefined,
          local: form.local || undefined,
          valor: form.valor ? Number(form.valor) : undefined,
          dataAssinatura: form.dataAssinatura || undefined,
        },
        responsavel: { nome: form.rtNome || undefined, titulo: form.rtTitulo || undefined, crea: form.crea || undefined },
      })
      toast.success('PDF gerado!')
      onClose()
    } catch (e) {
      console.error('export planejamento pdf error:', e)
      toast.error('Erro ao gerar o PDF.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal
      title="Exportar cronograma (PDF)"
      subtitle="Documento físico-financeiro pronto para enviar ao cliente"
      width="max-w-xl"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleGenerate} disabled={loading || generating}>
            {generating ? 'Gerando…' : 'Gerar PDF'}
          </Btn>
        </>
      }
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Conteúdo" value={mode} onChange={e => setMode(e.target.value as PlanejamentoPdfMode)}
              options={[
                { value: 'completo', label: 'Completo (capa + Gantt + tabela)' },
                { value: 'resumo', label: 'Resumo executivo (capa + Gantt)' },
              ]} />
            <label className="flex items-end pb-2.5">
              <span className="flex items-center gap-2 cursor-pointer select-none text-sm text-white/70">
                <input type="checkbox" checked={capa} onChange={e => setCapa(e.target.checked)}
                  className="w-4 h-4 accent-white/80" />
                Incluir capa do contrato
              </span>
            </label>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 pt-1">Dados do contrato (capa)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contrato nº" placeholder="Ex: CT-2026/014"
              value={form.numero} onChange={e => set('numero', e.target.value)} />
            <Input label="Data de assinatura" type="date"
              value={form.dataAssinatura} onChange={e => set('dataAssinatura', e.target.value)} />
          </div>
          <Input label="Objeto do contrato" placeholder="Ex: Reforma e ampliação de residência"
            value={form.objeto} onChange={e => set('objeto', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contratante" value={form.contratante} onChange={e => set('contratante', e.target.value)} />
            <Input label="Contratada" value={form.contratada} onChange={e => set('contratada', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Local" value={form.local} onChange={e => set('local', e.target.value)} />
            <Input label="Valor do contrato (R$)" type="number" min="0" step="0.01"
              value={form.valor} onChange={e => set('valor', e.target.value)} />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 pt-1">Responsável técnico (assinatura)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome do responsável" placeholder="Ex: Eng. Fulano de Tal"
              value={form.rtNome} onChange={e => set('rtNome', e.target.value)} />
            <Input label="Título" placeholder="Engenheiro Civil"
              value={form.rtTitulo} onChange={e => set('rtTitulo', e.target.value)} />
          </div>
          <Input label="CREA / CAU" placeholder="Ex: SP-123456789"
            value={form.crea} onChange={e => set('crea', e.target.value)} />
        </>
      )}
    </Modal>
  )
}
