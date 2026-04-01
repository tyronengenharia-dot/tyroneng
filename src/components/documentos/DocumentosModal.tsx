'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function DocumentoModal({ categoriaId, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    orgao: '',
    numero: '',
    data_emissao: '',
    tem_validade: false,
    data_validade: '',
    url_emissao: '',
    dias_renovacao: '',
    arquivo_url: ''
  })

  const [file, setFile] = useState<any>(null)

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function uploadFile(userId: string) {
    if (!file) return null

    const filePath = `${userId}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file)

    if (error) {
      alert('Erro no upload')
      return null
    }

    const { data } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSave() {
    try {
      setLoading(true)

      if (!form.nome) {
        alert('Nome obrigatório')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      const arquivo_url = await uploadFile(user.id)

      const { error } = await supabase
        .from('documentos')
        .insert([
          {
            ...form,
            categoria_id: categoriaId,
            user_id: user.id,
            arquivo_url,
            data_validade: form.tem_validade ? form.data_validade : null,
            dias_renovacao: form.tem_validade ? Number(form.dias_renovacao) : null
          }
        ])

      if (error) {
        alert(error.message)
        return
      }

      onSave()
      onClose()

    } catch (err) {
      console.error(err)
      alert('Erro ao salvar')
    } finally {
      setLoading(false)
    }

    if (form.tem_validade && !form.dias_renovacao) {
        alert('Informe quantos dias leva para renovar')
        return
      }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

<div className="bg-[#111] p-6 rounded-2xl w-full max-w-lg space-y-6">

  <h2 className="text-lg font-semibold">
    Novo Documento
  </h2>

  {/* 🧾 IDENTIFICAÇÃO */}
  <div className="space-y-3 border border-[#1f1f1f] rounded-xl p-4 bg-[#0D0D0D]">
    <span className="text-xs font-medium text-gray-400">Identificação</span>

    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">Nome do documento</label>
      <input
        value={form.nome}
        onChange={e => handleChange('nome', e.target.value)}
        className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-gray-400">Órgão emissor</label>
        <input
          value={form.orgao}
          onChange={e => handleChange('orgao', e.target.value)}
          className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400">Número</label>
        <input
          value={form.numero}
          onChange={e => handleChange('numero', e.target.value)}
          className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
        />
      </div>
    </div>
  </div>

  {/* 📅 DATAS */}
  <div className="space-y-3 border border-[#1f1f1f] rounded-xl p-4 bg-[#0D0D0D]">
    <span className="text-xs font-medium text-gray-400">Datas</span>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-gray-400">Data de emissão</label>
        <input
          type="date"
          value={form.data_emissao}
          onChange={e => handleChange('data_emissao', e.target.value)}
          className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400">Data de validade</label>
        <input
          type="date"
          disabled={!form.tem_validade}
          value={form.data_validade}
          onChange={e => handleChange('data_validade', e.target.value)}
          className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
        />
      </div>
    </div>

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={form.tem_validade}
        onChange={e => handleChange('tem_validade', e.target.checked)}
      />
      <span className="text-sm">Possui validade</span>
    </div>
  </div>

  {form.tem_validade && (
  <div>
    <label className="text-xs text-gray-400">Dias para renovar</label>
    <input
      type="number"
      min="0"
      required
      value={form.dias_renovacao}
      onChange={e => handleChange('dias_renovacao', e.target.value)}
      placeholder="Ex: 31"
      className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
      focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
      transition-all placeholder:text-gray-500"
    />
  </div>
)}

  {/* 🌐 ORIGEM */}
  <div className="space-y-2">
    <span className="text-xs font-medium text-gray-400">Origem</span>

    <div>
      <label className="text-xs text-gray-400">URL para emissão</label>
      <input
        value={form.url_emissao}
        onChange={e => handleChange('url_emissao', e.target.value)}
        className="w-full p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg mt-1 
focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 
transition-all placeholder:text-gray-500"
      />
    </div>
  </div>

  {/* 📎 ARQUIVO */}
  <div className="space-y-2">
    <span className="text-xs font-medium text-gray-400">Arquivo</span>

    <input
      type="file"
      onChange={e => setFile(e.target.files?.[0])}
      className="text-sm"
    />
  </div>

  {/* ACTIONS */}
  <div className="flex justify-end gap-2 pt-2">
    <button onClick={onClose}>
      Cancelar
    </button>

    <button
      onClick={handleSave}
      className="bg-yellow-500 hover:bg-yellow-400 transition px-5 py-2.5 rounded-lg font-medium text-black shadow-md"
    >
      {loading ? 'Salvando...' : 'Salvar'}
    </button>
  </div>

</div>

    </div>
  )
}