'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Autoridade } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input, Select, Textarea } from './shared/FormField'

interface Props {
  autoridade: Autoridade | null
  onClose: () => void
  onSave: () => void
}

export function AutoridadeModal({ autoridade, onClose, onSave }: Props) {
  const isEditing = !!autoridade
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', orgao: '', cargo: '', jurisdicao: '',
    telefone: '', email: '', endereco: '', status: 'ativo', observacoes: '',
  })

  useEffect(() => {
    if (autoridade) setForm({
      nome: autoridade.nome || '', orgao: autoridade.orgao || '',
      cargo: autoridade.cargo || '', jurisdicao: autoridade.jurisdicao || '',
      telefone: autoridade.telefone || '', email: autoridade.email || '',
      endereco: autoridade.endereco || '', status: autoridade.status || 'ativo',
      observacoes: autoridade.observacoes || '',
    })
  }, [autoridade])

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit() {
    if (!form.nome) return
    setSaving(true)
    const payload = {
      ...form,
      telefone: form.telefone || null, email: form.email || null,
      endereco: form.endereco || null, jurisdicao: form.jurisdicao || null,
      observacoes: form.observacoes || null,
    }
    if (isEditing) {
      const { error } = await supabase.from('autoridades').update(payload).eq('id', autoridade!.id)
      if (error) { console.error(error); setSaving(false); return }
    } else {
      const { error } = await supabase.from('autoridades').insert([payload])
      if (error) { console.error(error); setSaving(false); return }
    }
    onSave()
  }

  return (
    <ModalBase
      title={isEditing ? 'Editar Autoridade' : 'Nova Autoridade'}
      subtitle="Contato em órgão público ou regulatório"
      onClose={onClose}
    >
      <div className="space-y-4">
        <FormField label="Nome completo" required>
          <Input placeholder="Nome da autoridade" value={form.nome} onChange={e => set('nome', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Órgão / Instituição">
            <Input placeholder="Ex: CREA, Prefeitura, INEA" value={form.orgao} onChange={e => set('orgao', e.target.value)} />
          </FormField>
          <FormField label="Cargo">
            <Input placeholder="Ex: Fiscal de Obras" value={form.cargo} onChange={e => set('cargo', e.target.value)} />
          </FormField>
          <FormField label="Jurisdição">
            <Input placeholder="Ex: Rio de Janeiro - RJ" value={form.jurisdicao} onChange={e => set('jurisdicao', e.target.value)} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}
              options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]} />
          </FormField>
          <FormField label="Telefone">
            <Input placeholder="(21) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" placeholder="email@orgao.gov.br" value={form.email} onChange={e => set('email', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Endereço / Sede">
          <Input placeholder="Rua, número, bairro" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
        </FormField>
        <FormField label="Observações">
          <Textarea rows={3} placeholder="Contexto, como conheceu, importância..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !form.nome}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >{saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar contato'}</button>
        </div>
      </div>
    </ModalBase>
  )
}
