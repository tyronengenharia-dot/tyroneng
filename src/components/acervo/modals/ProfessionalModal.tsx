'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Professional } from '@/types/acervo'

interface ProfessionalFormData {
  nome: string
  cargo: string
  registroNumero: string
  email: string
  telefone: string
  especialidades: string
  entrouEm: string
}

const defaultForm: ProfessionalFormData = {
  nome: '',
  cargo: '',
  registroNumero: '',
  email: '',
  telefone: '',
  especialidades: '',
  entrouEm: '',
}

const CARGOS = [
  'Engenheiro Civil',
  'Engenheiro Elétrico',
  'Engenheiro Mecânico',
  'Arquiteto',
  'Técnico em Edificações',
  'Mestre de Obras',
  'Gestor de Projetos',
]

interface ProfessionalModalProps {
  onClose: () => void
  onSave: (prof: Professional) => void
}

export default function ProfessionalModal({
  onClose,
  onSave,
}: ProfessionalModalProps) {
  const [form, setForm] = useState<ProfessionalFormData>(defaultForm)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof ProfessionalFormData>(
    key: K,
    value: ProfessionalFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.nome.trim()) { alert('Informe o nome'); return }
    if (!form.cargo) { alert('Selecione o cargo'); return }
    if (!form.registroNumero.trim()) { alert('Informe o número de registro (CREA/CAU)'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const especialidades = form.especialidades
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        user_id: user.id,
        nome: form.nome.trim(),
        cargo: form.cargo,
        registro_numero: form.registroNumero.trim(),
        email: form.email || null,
        telefone: form.telefone || null,
        especialidades,
        entrou_em: form.entrouEm || null,
        ativo: true,
      }

      const { data, error } = await supabase
        .from('profissionais')
        .insert(payload)
        .select()
        .single()

      if (error) throw new Error(error.message)

      const newProf: Professional = {
        id: data.id,
        name: data.nome,
        role: data.cargo,
        registrationNumber: data.registro_numero,
        email: data.email ?? '',
        phone: data.telefone ?? '',
        specialty: data.especialidades ?? [],
        active: data.ativo ?? true,
        joinedAt: data.entrou_em ?? '',
        documents: [],
        documentStatus: 'valid',
      }

      onSave(newProf)
      onClose()
    } catch (err: any) {
      alert(err.message ?? 'Erro ao salvar profissional')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Novo Profissional</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Identificação */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">Identificação</legend>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Nome completo *</label>
              <input
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Ex: Carlos Eduardo Mendes"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Cargo *</label>
                <select
                  value={form.cargo}
                  onChange={(e) => set('cargo', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-[#c8f65d]/50 transition"
                >
                  <option value="">Selecionar...</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Registro (CREA/CAU) *</label>
                <input
                  value={form.registroNumero}
                  onChange={(e) => set('registroNumero', e.target.value)}
                  placeholder="Ex: CREA-RJ 120.456-D"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
            </div>
          </fieldset>

          {/* Contato */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">Contato</legend>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Telefone</label>
                <input
                  value={form.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                  placeholder="(21) 99999-0000"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
            </div>
          </fieldset>

          {/* Especialidades + Data */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">Detalhes</legend>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Especialidades
                <span className="text-zinc-600 ml-1">(separadas por vírgula)</span>
              </label>
              <input
                value={form.especialidades}
                onChange={(e) => set('especialidades', e.target.value)}
                placeholder="Ex: Estruturas, Fundações, Perícias"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Data de entrada</label>
              <input
                type="date"
                value={form.entrouEm}
                onChange={(e) => set('entrouEm', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-[#c8f65d]/50 transition"
              />
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-[#c8f65d] text-black rounded-xl hover:bg-[#d4f97a] disabled:opacity-60 transition"
          >
            {loading ? 'Salvando...' : 'Salvar profissional'}
          </button>
        </div>
      </div>
    </div>
  )
}
