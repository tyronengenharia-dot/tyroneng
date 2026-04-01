'use client'

import { useState, MouseEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DocumentoRow } from './DocumentoRow'

export function DocumentoItem({ doc, onUpdate }: any) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newFile, setNewFile] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const [form, setForm] = useState({
    nome: doc.nome || '',
    orgao: doc.orgao || '',
    numero: doc.numero || '',
    data_emissao: doc.data_emissao || '',
    data_validade: doc.data_validade || '',
    tem_validade: doc.tem_validade || false,
    url_emissao: doc.url_emissao || ''
  })

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

async function handleSave() {
  try {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Usuário não autenticado')
      return
    }

    let arquivo_url = doc.arquivo_url

    // 🔥 se tem novo arquivo → faz upload
    if (newFile) {
      const newUrl = await uploadNewFile(user.id)
      if (newUrl) arquivo_url = newUrl
    }

    if (newFile && doc.arquivo_url) {
  const path = doc.arquivo_url.split('/documentos/')[1]

  await supabase.storage
    .from('documentos')
    .remove([path])
}

    const { error } = await supabase
      .from('documentos')
      .update({
        ...form,
        arquivo_url,
        data_validade: form.tem_validade ? form.data_validade : null
      })
      .eq('id', doc.id)

    if (error) {
      alert(error.message)
      return
    }

    setEditing(false)
    setNewFile(null)
    onUpdate()

  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}
  
    const dias = form.data_validade
      ? Math.ceil(
          (new Date(form.data_validade).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      : null

      const diasRenovacao = Math.max(doc.dias_renovacao || 0, 7)

      const status =
        form.tem_validade && dias !== null
          ? dias < 0
            ? 'vencido'
            : dias <= diasRenovacao
            ? 'renovar'
            : 'ok'
          : 'ok'

    const statusStyle: Record<string, string> = {
      vencido: 'bg-red-500/10 text-red-400',
      renovar: 'bg-yellow-500/10 text-yellow-400',
      ok: 'bg-green-500/10 text-green-400'
    }

    const statusLabel: Record<string, string> = {
      vencido: 'vencido',
      renovar: 'renovar já',
      ok: 'ok'
    }


async function handleDelete() {
  try {
    const confirm = window.confirm('Deseja excluir este documento?')

    if (!confirm) return

    // 🔥 deleta arquivo do storage (se existir)
    if (doc.arquivo_url) {
      const path = doc.arquivo_url.split('/documentos/')[1]

      if (path) {
        await supabase.storage
          .from('documentos')
          .remove([path])
      }
    }

    // 🔥 deleta do banco
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 atualiza tela
    onUpdate()

  } catch (err) {
    console.error(err)
    alert('Erro ao deletar')
  }
}

  async function uploadNewFile(userId: string) {
  if (!newFile) return null

  const filePath = `${userId}/${Date.now()}-${newFile.name}`

  const { error } = await supabase.storage
    .from('documentos')
    .upload(filePath, newFile)

  if (error) {
    alert('Erro no upload')
    return null
  }

  const { data } = supabase.storage
    .from('documentos')
    .getPublicUrl(filePath)

  return data.publicUrl
}


async function handleDownload() {
  try {
    const response = await fetch(doc.arquivo_url)
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = form.nome || 'documento'
    document.body.appendChild(a)
    a.click()
    a.remove()

    const ext = doc.arquivo_url.split('.').pop()
    a.download = `${form.nome}.${ext}`

    window.URL.revokeObjectURL(url)

  } catch (err) {
    console.error(err)
    alert('Erro ao baixar arquivo')
  }
}

  return (
<div className="group bg-[#181818] hover:bg-[#222] transition-all p-4 rounded-xl flex justify-between items-center border border-transparent hover:border-[#333]">

  {/* ESQUERDA */}
  <div className="flex items-center gap-3 w-full">

    <div className="text-xl">📄</div>

    <div className="flex flex-col w-full">

      {/* 🔥 NOME (NUNCA EDITA NO CLICK) */}
        <span
          onClick={() => setExpanded(!expanded)}
          className="font-medium cursor-pointer hover:underline"
        >
          {form.nome}
        </span>

        {expanded && !editing && (
  <div className="mt-2 text-xs opacity-70 space-y-1">

    {form.orgao && (
      <div><b>Órgão:</b> {form.orgao}</div>
    )}

    {form.numero && (
      <div><b>Número:</b> {form.numero}</div>
    )}

    {form.data_emissao && (
      <div><b>Emissão:</b> {form.data_emissao}</div>
    )}

    {form.tem_validade && form.data_validade && (
      <div><b>Validade:</b> {form.data_validade}</div>
    )}

    {form.url_emissao && (
      <div>
        <b>Link:</b>{' '}
        <a
          href={form.url_emissao.startsWith('http') ? form.url_emissao : `https://${form.url_emissao}`}
          target="_blank"
          className="text-blue-400 hover:underline"
        >
          Abrir
        </a>
      </div>
    )}

  </div>
)}
{!editing && (
  <span className="text-xs opacity-50 mt-0.5">
    {form.data_emissao && (
      <>Emissão: {new Date(form.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR')}</>
    )}
    {form.data_emissao && form.tem_validade && form.data_validade && ' — '}
    {form.tem_validade && form.data_validade && (
      <>Validade: {new Date(form.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}</>
    )}
    {form.tem_validade && dias !== null && (
      <span className="ml-2">
        {dias < 0
          ? `· Vencido há ${Math.abs(dias)} dias`
          : `· Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
      </span>
    )}
  </span>
)}

      {/* 🔥 MODO EDIÇÃO COMPLETO */}
{editing && (
  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">

    {/* NOME */}
    <div className="col-span-2 flex flex-col gap-1">
      <label className="opacity-50">Nome do documento</label>
      <input
        value={form.nome}
        onChange={(e) => handleChange('nome', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* ÓRGÃO */}
    <div className="flex flex-col gap-1">
      <label className="opacity-50">Órgão</label>
      <input
        value={form.orgao}
        onChange={(e) => handleChange('orgao', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* NÚMERO */}
    <div className="flex flex-col gap-1">
      <label className="opacity-50">Número</label>
      <input
        value={form.numero}
        onChange={(e) => handleChange('numero', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* EMISSÃO */}
    <div className="flex flex-col gap-1">
      <label className="opacity-50">Data de emissão</label>
      <input
        type="date"
        value={form.data_emissao}
        onChange={(e) => handleChange('data_emissao', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* VALIDADE */}
    <div className="flex flex-col gap-1">
      <label className="opacity-50">Data de validade</label>
      <input
        type="date"
        value={form.data_validade}
        onChange={(e) => handleChange('data_validade', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* CHECKBOX */}
    <div className="col-span-2 flex items-center gap-2 mt-1">
      <input
        type="checkbox"
        checked={form.tem_validade}
        onChange={(e) => handleChange('tem_validade', e.target.checked)}
      />
      <span className="opacity-70">Possui validade</span>
    </div>

    {/* URL */}
    <div className="col-span-2 flex flex-col gap-1">
      <label className="opacity-50">URL de emissão</label>
      <input
        value={form.url_emissao}
        onChange={(e) => handleChange('url_emissao', e.target.value)}
        className="bg-[#222] px-2 py-1 rounded"
      />
    </div>

    {/* ARQUIVO */}
    <div className="col-span-2 flex flex-col gap-1">
      <label className="opacity-50">Arquivo</label>
      <input
        type="file"
        onChange={(e) => setNewFile(e.target.files?.[0])}
        className="text-xs"
      />
    </div>

  </div>
)}

    </div>
  </div>

  {/* DIREITA */}
  <div className="flex items-center gap-2">

    {/* STATUS */}
      <span className={`px-2 py-1 text-xs rounded ${statusStyle[status]}`}>
        {status}
      </span>

    {/* 👁️ */}

    <button onClick={() => setPreviewUrl(doc.arquivo_url)}>
      👁️
    </button>

    {/* ⬇️ */}
    {doc.arquivo_url && !editing && (
        <button
          onClick={handleDownload}
          className="opacity-60 hover:opacity-100 transition"
        >
          ⬇️
        </button>
    )}

    {/* 🗑️ */}
    {!editing && (
      <button
        onClick={(e) => {
          e.stopPropagation() // 🔥 importante (evita abrir expand)
          handleDelete()
        }}
        className="text-red-400 hover:text-red-300"
      >
        🗑️
      </button>
    )}

    {/* ✏️ */}
    {!editing && (
      <button onClick={() => setEditing(true)}>
        ✏️
      </button>
    )}

    {/* 💾 */}
    {editing && (
      <>
        <button onClick={handleSave}>
          💾
        </button>

        <button onClick={() => setEditing(false)}>
          ❌
        </button>
      </>
    )}

  </div>

{previewUrl && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

    <div className="bg-[#111] w-[90%] h-[90%] rounded-2xl overflow-hidden relative">

      {/* FECHAR */}
      <button
        onClick={() => setPreviewUrl(null)}
        className="absolute top-3 right-3 text-white text-xl"
      >
        ✕
      </button>

      {/* PDF / DOCUMENTO */}
      <iframe
        src={previewUrl}
        className="w-full h-full"
      />

    </div>

  </div>
)}

</div>
  )
}
