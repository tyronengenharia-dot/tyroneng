'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { PessoaProxima } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input, Select, Textarea } from './shared/FormField'

interface Props {
  pessoa: PessoaProxima | null
  onClose: () => void
  onSave: () => void
}

export function PessoaProximaModal({ pessoa, onClose, onSave }: Props) {
  const isEditing = !!pessoa
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', relacao: '', empresa: '', cargo: '',
    telefone: '', email: '', area: '',
    como_conheceu: '', status: 'ativo', observacoes: '',
  })

  useEffect(() => {
    if (pessoa) setForm({
      nome: pessoa.nome || '', relacao: pessoa.relacao || '',
      empresa: pessoa.empresa || '', cargo: pessoa.cargo || '',
      telefone: pessoa.telefone || '', email: pessoa.email || '',
      area: pessoa.area || '', como_conheceu: pessoa.como_conheceu || '',
      status: pessoa.status || 'ativo', observacoes: pessoa.observacoes || '',
    })
  }, [pessoa])

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit() {
    if (!form.nome) return
    setSaving(true)
    const payload = {
      ...form,
      empresa: form.empresa || null, cargo: form.cargo || null,
      telefone: form.telefone || null, email: form.email || null,
      area: form.area || null, como_conheceu: form.como_conheceu || null,
      observacoes: form.observacoes || null,
    }
    if (isEditing) {
      const { error } = await supabase.from('pessoas_proximas').update(payload).eq('id', pessoa!.id)
      if (error) { console.error(error); setSaving(false); return }
    } else {
      const { error } = await supabase.from('pessoas_proximas').insert([payload])
      if (error) { console.error(error); setSaving(false); return }
    }
    onSave()
  }

  return (
    <ModalBase
      title={isEditing ? 'Editar Contato' : 'Nova Pessoa Próxima'}
      subtitle="Rede de relacionamentos e contatos estratégicos"
      onClose={onClose}
    >
      <div className="space-y-4">
        <FormField label="Nome completo" required>
          <Input placeholder="Nome do contato" value={form.nome} onChange={e => set('nome', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo de relação" required>
            <Input placeholder="Ex: Parceiro, Amigo, Mentor, Investidor" value={form.relacao} onChange={e => set('relacao', e.target.value)} />
          </FormField>
          <FormField label="Área de atuação">
            <Input placeholder="Ex: Engenharia, Direito, Financeiro" value={form.area} onChange={e => set('area', e.target.value)} />
          </FormField>
          <FormField label="Empresa">
            <Input placeholder="Onde trabalha" value={form.empresa} onChange={e => set('empresa', e.target.value)} />
          </FormField>
          <FormField label="Cargo">
            <Input placeholder="Cargo ou função" value={form.cargo} onChange={e => set('cargo', e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <Input placeholder="(21) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}
              options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]} />
          </FormField>
          <FormField label="Como conheceu">
            <Input placeholder="Ex: Indicação, Evento, LinkedIn" value={form.como_conheceu} onChange={e => set('como_conheceu', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Observações">
          <Textarea rows={3} placeholder="Contexto, oportunidades, histórico..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
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
