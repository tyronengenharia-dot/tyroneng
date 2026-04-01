'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Funcionario } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input, Select } from './shared/FormField'

interface Props {
  funcionario: Funcionario | null
  onClose: () => void
  onSave: () => void
}

export function FuncionarioModal({ funcionario, onClose, onSave }: Props) {
  const isEditing = !!funcionario
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    departamento: '',
    salario: '',
    status: 'ativo',
    email: '',
    telefone: '',
    cpf: '',
    data_admissao: '',
    data_nascimento: '',
    endereco: '',
  })

  useEffect(() => {
    if (funcionario) {
      setForm({
        nome: funcionario.nome || '',
        cargo: funcionario.cargo || '',
        departamento: funcionario.departamento || '',
        salario: funcionario.salario?.toString() || '',
        status: funcionario.status || 'ativo',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        cpf: funcionario.cpf || '',
        data_admissao: funcionario.data_admissao || '',
        data_nascimento: funcionario.data_nascimento || '',
        endereco: funcionario.endereco || '',
      })
    }
  }, [funcionario])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.nome || !form.salario) return
    setSaving(true)

    const payload = {
      nome: form.nome,
      cargo: form.cargo,
      departamento: form.departamento,
      salario: Number(form.salario),
      status: form.status,
      email: form.email || null,
      telefone: form.telefone || null,
      cpf: form.cpf || null,
      data_admissao: form.data_admissao || null,
      data_nascimento: form.data_nascimento || null,
      endereco: form.endereco || null,
    }

    if (isEditing) {
      const { error } = await supabase.from('funcionarios').update(payload).eq('id', funcionario!.id)
      if (error) { console.error(error); setSaving(false); return }
    } else {
      const { error } = await supabase.from('funcionarios').insert([payload])
      if (error) { console.error(error); setSaving(false); return }
    }

    onSave()
  }

  return (
    <ModalBase
      title={isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
      subtitle={isEditing ? funcionario?.nome : 'Preencha os dados do novo funcionário'}
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nome completo" required>
              <Input placeholder="João Silva" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cargo">
            <Input placeholder="Engenheiro Civil" value={form.cargo} onChange={e => set('cargo', e.target.value)} />
          </FormField>
          <FormField label="Departamento">
            <Input placeholder="Obras" value={form.departamento} onChange={e => set('departamento', e.target.value)} />
          </FormField>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Salário (R$)" required>
            <Input type="number" placeholder="5000" value={form.salario} onChange={e => set('salario', e.target.value)} />
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'ferias', label: 'Férias' },
                { value: 'afastado', label: 'Afastado' },
              ]}
            />
          </FormField>
        </div>

        {/* Divider */}
        <div className="border-t border-white/8 pt-5">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-4">Informações de contato</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="E-mail">
              <Input type="email" placeholder="joao@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </FormField>
            <FormField label="Telefone">
              <Input placeholder="(21) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="CPF">
            <Input placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
          </FormField>
          <FormField label="Data de admissão">
            <Input type="date" value={form.data_admissao} onChange={e => set('data_admissao', e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data de nascimento">
            <Input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
          </FormField>
          <FormField label="Endereço">
            <Input placeholder="Rua, número, bairro" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nome || !form.salario}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar funcionário'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
