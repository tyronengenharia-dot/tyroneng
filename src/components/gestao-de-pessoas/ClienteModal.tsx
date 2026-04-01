'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Cliente } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input, Select, Textarea } from './shared/FormField'

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSave: () => void
}

export function ClienteModal({ cliente, onClose, onSave }: Props) {
  const isEditing = !!cliente
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', tipo: 'pessoa_fisica', empresa: '', cnpj_cpf: '',
    email: '', telefone: '', endereco: '', cidade: '', estado: '',
    status: 'ativo', origem: '', observacoes: '',
  })

  useEffect(() => {
    if (cliente) setForm({
      nome: cliente.nome || '', tipo: cliente.tipo || 'pessoa_fisica',
      empresa: cliente.empresa || '', cnpj_cpf: cliente.cnpj_cpf || '',
      email: cliente.email || '', telefone: cliente.telefone || '',
      endereco: cliente.endereco || '', cidade: cliente.cidade || '',
      estado: cliente.estado || '', status: cliente.status || 'ativo',
      origem: cliente.origem || '', observacoes: cliente.observacoes || '',
    })
  }, [cliente])

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit() {
    if (!form.nome) return
    setSaving(true)
    const payload = { ...form, cnpj_cpf: form.cnpj_cpf || null, empresa: form.empresa || null, email: form.email || null, telefone: form.telefone || null, endereco: form.endereco || null, cidade: form.cidade || null, estado: form.estado || null, origem: form.origem || null, observacoes: form.observacoes || null }
    if (isEditing) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente!.id)
      if (error) { console.error(error); setSaving(false); return }
    } else {
      const { error } = await supabase.from('clientes').insert([payload])
      if (error) { console.error(error); setSaving(false); return }
    }
    onSave()
  }

  return (
    <ModalBase
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      subtitle={isEditing ? cliente?.nome : 'Preencha os dados do cliente'}
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nome completo" required>
              <Input placeholder="Nome do cliente" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Tipo">
            <Select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              options={[{ value: 'pessoa_fisica', label: 'Pessoa Física' }, { value: 'pessoa_juridica', label: 'Pessoa Jurídica' }]} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}
              options={[{ value: 'ativo', label: 'Ativo' }, { value: 'prospecto', label: 'Prospecto' }, { value: 'inativo', label: 'Inativo' }, { value: 'ex_cliente', label: 'Ex-cliente' }]} />
          </FormField>
          <FormField label="Empresa">
            <Input placeholder="Razão social" value={form.empresa} onChange={e => set('empresa', e.target.value)} />
          </FormField>
          <FormField label="CPF / CNPJ">
            <Input placeholder="000.000.000-00" value={form.cnpj_cpf} onChange={e => set('cnpj_cpf', e.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <Input placeholder="(21) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </FormField>
          <FormField label="Cidade">
            <Input placeholder="Rio de Janeiro" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
          </FormField>
          <FormField label="Estado">
            <Input placeholder="RJ" value={form.estado} onChange={e => set('estado', e.target.value)} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Endereço">
              <Input placeholder="Rua, número, bairro" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Origem">
            <Input placeholder="Como conheceu?" value={form.origem} onChange={e => set('origem', e.target.value)} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Observações">
              <Textarea rows={3} placeholder="Notas adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nome}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar cliente'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
