'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getDocumentosByObra, createDocumento, deleteDocumento } from '@/services/equipeService'
import { Documento, DocumentoTipo } from '@/types'
import { Btn, EmptyState, LoadingSpinner, Modal, Input, Select } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'

type Props = { obra_id: string }

// ── Icon por tipo ─────────────────────────────────────────────────────────────

const tipoConfig: Record<DocumentoTipo, { icon: string; bg: string; label: string }> = {
  contrato: { icon: '📋', bg: 'bg-purple-500/15', label: 'Contrato' },
  projeto:  { icon: '📐', bg: 'bg-blue-500/15',   label: 'Projeto' },
  art:      { icon: '🔏', bg: 'bg-amber-500/15',  label: 'ART/RRT' },
  foto:     { icon: '🖼',  bg: 'bg-teal-500/15',   label: 'Foto' },
  planilha: { icon: '📊', bg: 'bg-green-500/15',  label: 'Planilha' },
  outro:    { icon: '📄', bg: 'bg-white/5',        label: 'Outro' },
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function DocumentoModal({
  obra_id,
  onClose,
  onSuccess,
}: {
  obra_id: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome:        '',
    tipo:        'outro' as DocumentoTipo,
    descricao:   '',
    url:         '',
    data_upload: new Date().toISOString().slice(0, 10),
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Informe o nome do documento'); return }
    setSaving(true)
    const ok = await createDocumento({
      obra_id,
      nome: form.nome.trim(),
      tipo: form.tipo,
      descricao: form.descricao,
      url: form.url,
      data_upload: form.data_upload,
    })
    setSaving(false)
    if (ok) { toast.success('Documento registrado!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar')
  }

  return (
    <Modal
      title="Adicionar documento"
      subtitle="Registre um documento ou contrato desta obra"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Btn>
        </>
      }
    >
      <Input label="Nome do documento" required placeholder="Ex: Contrato Principal Prefeitura RJ"
        value={form.nome} onChange={e => set('nome', e.target.value)} />

      <Select label="Tipo" value={form.tipo} onChange={e => set('tipo', e.target.value)}
        options={Object.entries(tipoConfig).map(([v, c]) => ({ value: v, label: c.label }))} />

      <Input label="Descrição" placeholder="Observações sobre o documento"
        value={form.descricao} onChange={e => set('descricao', e.target.value)} />

      <Input label="Link / URL" type="url" placeholder="https://drive.google.com/..."
        value={form.url} onChange={e => set('url', e.target.value)} />

      <Input label="Data" type="date"
        value={form.data_upload} onChange={e => set('data_upload', e.target.value)} />
    </Modal>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TIPO_ORDER: DocumentoTipo[] = ['contrato', 'art', 'projeto', 'planilha', 'foto', 'outro']

export function DocumentosTab({ obra_id }: Props) {
  const [docs, setDocs]       = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)

  async function load() {
    const data = await getDocumentosByObra(obra_id)
    setDocs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este documento?')) return
    await deleteDocumento(id)
    toast.success('Documento removido')
    load()
  }

  if (loading) return <LoadingSpinner />

  // Group by tipo
  const groups = TIPO_ORDER
    .map(tipo => ({
      tipo,
      config: tipoConfig[tipo],
      items: docs.filter(d => d.tipo === tipo),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-white">Documentos & Contratos</p>
          <p className="text-xs text-white/30 mt-0.5">{docs.length} arquivos registrados</p>
        </div>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      {docs.length === 0 ? (
        <EmptyState message="Nenhum documento registrado nesta obra" />
      ) : (
        groups.map(group => (
          <div key={group.tipo}>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-3">
              {group.config.label}s
            </p>
            <div className="grid grid-cols-2 gap-3">
              {group.items.map(doc => (
                <div
                  key={doc.id}
                  className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-4 flex gap-3 group hover:border-white/15 transition-colors"
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0',
                    group.config.bg
                  )}>
                    {group.config.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{doc.nome}</p>
                    {doc.descricao && (
                      <p className="text-xs text-white/40 mt-0.5 truncate">{doc.descricao}</p>
                    )}
                    <p className="text-[11px] text-white/25 mt-1">{fmtDate(doc.data_upload)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity items-start">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-medium bg-white/5 border border-white/10 text-white/50 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Abrir
                      </a>
                    )}
                    <Btn variant="danger" onClick={() => handleDelete(doc.id)}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modal && (
        <DocumentoModal
          obra_id={obra_id}
          onClose={() => setModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
