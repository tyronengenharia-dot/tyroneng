'use client'

import { supabase } from '@/lib/supabaseClient'

function getStatus(date: string) {
  const hoje = new Date()
  const validade = new Date(date)

  const diff = (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)

  if (diff < 0) return { label: 'Vencido', color: 'text-red-500' }
  if (diff <= 15) return { label: 'Atenção', color: 'text-yellow-500' }
  return { label: 'OK', color: 'text-green-500' }
}

export function DocumentoRow({ doc, onUpdate }: any) {
  const status = getStatus(doc.data_validade)

  async function deleteDoc() {
    if (!confirm('Excluir documento?')) return

    await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id)

    onUpdate()
  }

  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded-xl">

      <div>
        <p className="font-medium">{doc.nome}</p>
        <p className="text-sm opacity-60">
          {doc.data_validade}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className={status.color}>{status.label}</span>

        <a href={doc.arquivo_url} target="_blank">⬇</a>
        <button onClick={deleteDoc}>🗑</button>
      </div>
    </div>
  )
}