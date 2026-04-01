'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function EmployeeModal({ onClose, onSave, employee }: any) {
  const isEditing = !!employee

  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    salario: '',
    status: 'ativo',
  })

  // 🔥 preenche o form quando for edição
  useEffect(() => {
    if (employee) {
      setForm({
        nome: employee.nome,
        cargo: employee.cargo,
        salario: employee.salario.toString(),
        status: employee.status,
      })
    }
  }, [employee])

  async function handleSubmit() {
    if (isEditing) {
      // ✏️ UPDATE
      const { error } = await supabase
        .from('funcionarios')
        .update({
          nome: form.nome,
          cargo: form.cargo,
          salario: Number(form.salario),
          status: form.status,
        })
        .eq('id', employee.id)

      if (error) {
        console.error(error)
        return
      }
    } else {
      // ➕ INSERT
      const { error } = await supabase.from('funcionarios').insert([
        {
          nome: form.nome,
          cargo: form.cargo,
          salario: Number(form.salario),
          status: form.status,
        },
      ])

      if (error) {
        console.error(error)
        return
      }
    }

    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
        </h2>

        <input
          placeholder="Nome"
          className="input"
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
        />

        <input
          placeholder="Cargo"
          className="input"
          value={form.cargo}
          onChange={e => setForm({ ...form,  cargo: e.target.value })}
        />

        <input
          type="number"
          placeholder="Salário"
          className="input"
          value={form.salario}
          onChange={e => setForm({ ...form, salario: e.target.value })}
        />

        <select
          className="input"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={handleSubmit}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            {isEditing ? 'Salvar alterações' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}