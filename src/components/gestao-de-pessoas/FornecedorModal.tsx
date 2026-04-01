'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Fornecedor } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input, Select, Textarea } from './shared/FormField'

interface Props {
  fornecedor: Fornecedor | null
  onClose: () => void
  onSave: () => void
}

export function FornecedorModal({ fornecedor, onClose, onSave }: Props) {
  const isEditing = !!fornecedor
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', razao_social: '', cnpj: '', categoria: '', email: '',
    telefone: '', contato_nome: '', endereco: '', cidade: '', estado: '',
    status: 'ativo', avaliacao: '0', observacoes: '',
  })

  useEffect(() => {
    if (fornecedor) setForm({
      nome: fornecedor.nome || '', razao_social: fornecedor.razao_social || '',
      cnpj: fornecedor.cnpj || '', categoria: fornecedor.categoria || '',
      email: fornecedor.email || '', telefone: fornecedor.telefone || '',
      contato_nome: fornecedor.contato_nome || '', endereco: fornecedor.endereco || '',
      cidade: fornecedor.cidade || '', estado: fornecedor.estado || '',
      status: fornecedor.status || 'ativo',
      avaliacao: fornecedor.avaliacao?.toString() || '0',
      observacoes: fornecedor.observacoes || '',
    })
  }, [fornecedor])

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit() {
    if (!form.nome) return
    setSaving(true)
    const payload = {
      ...form,
      avaliacao: Number(form.avaliacao) || null,
      razao_social: form.razao_social || null, cnpj: form.cnpj || null,
      email: form.email || null, telefone: form.telefone || null,
      contato_nome: form.contato_nome || null, endereco: form.endereco || null,
      cidade: form.cidade || null, estado: form.estado || null,
      observacoes: form.observacoes || null,
    }
    if (isEditing) {
      const { error } = await supabase.from('fornecedores').update(payload).eq('id', fornecedor!.id)
      if (error) { console.error(error); setSaving(false); return }
    } else {
      const { error } = await supabase.from('fornecedores').insert([payload])
      if (error) { console.error(error); setSaving(false); return }
    }
    onSave()
  }

  return (
    <ModalBase
      title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      subtitle={isEditing ? fornecedor?.nome : 'Cadastre um novo fornecedor ou parceiro'}
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nome / Nome fantasia" required>
              <Input placeholder="Nome do fornecedor" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Razão social">
            <Input placeholder="Razão social completa" value={form.razao_social} onChange={e => set('razao_social', e.target.value)} />
          </FormField>
          <FormField label="CNPJ">
            <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
          </FormField>
          <FormField label="Categoria">
            <Input placeholder="Ex: Materiais, Serviços, Equipamentos" value={form.categoria} onChange={e => set('categoria', e.target.value)} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'homologado', label: 'Homologado' },
                { value: 'suspenso', label: 'Suspenso' },
                { value: 'inativo', label: 'Inativo' },
              ]}
            />
          </FormField>
          <FormField label="Nome do contato">
            <Input placeholder="Responsável" value={form.contato_nome} onChange={e => set('contato_nome', e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <Input placeholder="(21) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" placeholder="contato@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </FormField>
          <FormField label="Avaliação (1–5)">
            <Select value={form.avaliacao} onChange={e => set('avaliacao', e.target.value)}
              options={[
                { value: '0', label: 'Não avaliado' },
                { value: '1', label: '★ 1 — Ruim' },
                { value: '2', label: '★★ 2 — Regular' },
                { value: '3', label: '★★★ 3 — Bom' },
                { value: '4', label: '★★★★ 4 — Muito Bom' },
                { value: '5', label: '★★★★★ 5 — Excelente' },
              ]}
            />
          </FormField>
          <FormField label="Cidade">
            <Input placeholder="Cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
          </FormField>
          <FormField label="Estado">
            <Input placeholder="RJ" value={form.estado} onChange={e => set('estado', e.target.value)} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Observações">
              <Textarea rows={3} placeholder="Notas sobre este fornecedor..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
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
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar fornecedor'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
