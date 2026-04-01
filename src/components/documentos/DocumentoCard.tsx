import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DocumentoModal } from '@/components/documentos/DocumentosModal'
import { CategoriaModal } from './CategoriaModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { DocumentoItem } from './DocumentoItem'



export function CategoriaCard({ categoria, onUpdate }: any) {
  const [open, setOpen] = useState(true)
  const [openDocModal, setOpenDocModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  async function handleDelete() {
    await supabase.from('documentos').delete().eq('categoria_id', categoria.id)
    await supabase.from('categorias_documentos').delete().eq('id', categoria.id)
    onUpdate()
  }

  const docsOrdenados = [...(categoria.documentos || [])].sort((a, b) => {
    const ordem: Record<string, number> = { vencido: 0, atencao: 1, ok: 2 }
    return (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3)
  })

  return (
    <div className="bg-[#111] rounded-2xl p-4">

      <div className="flex justify-between items-center">

        <div onClick={() => setOpen(!open)} className="cursor-pointer flex gap-2">
          📁 <b>{categoria.nome}</b>
          <span className="opacity-50">({categoria.documentos?.length || 0})</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setOpenEditModal(true)}>✏️</button>
          <button onClick={() => setOpenDeleteModal(true)}>🗑️</button>
          <button onClick={() => setOpenDocModal(true)}>+ Doc</button>
        </div>

      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {docsOrdenados.map(doc => (
            <DocumentoItem key={doc.id} doc={doc} onUpdate={onUpdate} />
          ))}
        </div>
      )}

      {openDocModal && (
        <DocumentoModal categoriaId={categoria.id} onClose={() => setOpenDocModal(false)} onSave={onUpdate} />
      )}

      {openEditModal && (
        <CategoriaModal categoria={categoria} onClose={() => setOpenEditModal(false)} onSave={onUpdate} />
      )}

      {openDeleteModal && (
        <ConfirmDeleteModal onConfirm={handleDelete} onClose={() => setOpenDeleteModal(false)} />
      )}

    </div>
  )
}