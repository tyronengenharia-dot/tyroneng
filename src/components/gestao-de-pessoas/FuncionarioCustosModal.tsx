'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Funcionario } from '@/types/pessoa'
import { ModalBase } from './shared/ModalBase'
import { FormField, Input } from './shared/FormField'

interface Props {
  funcionario: Funcionario
  onClose: () => void
  onSaved: () => void
}

const tabs = [
  { id: 'encargos', label: 'Encargos' },
  { id: 'provisoes', label: 'Provisões' },
  { id: 'beneficios', label: 'Benefícios' },
  { id: 'outros', label: 'Outros' },
]

export function FuncionarioCustosModal({ funcionario, onClose, onSaved }: Props) {
  const [tab, setTab] = useState('encargos')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    inss: '20', fgts: '8', rat: '1', terceiros: '5.8',
    ferias: '11.11', decimo: '8.33',
    vt: '0', vr: '0', plano_saude: '0',
    outros: '0',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const salario = Number(funcionario.salario || 0)

  function calcExtras() {
    const pct = (k: string) => salario * (Number(form[k as keyof typeof form]) / 100)
    const val = (k: string) => Number(form[k as keyof typeof form])
    return pct('inss') + pct('fgts') + pct('rat') + pct('terceiros') +
      pct('ferias') + pct('decimo') +
      val('vt') + val('vr') + val('plano_saude') + val('outros')
  }

  const extras = calcExtras()
  const custoTotal = salario + extras

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('funcionarios')
      .update({ extras, custo_total: custoTotal })
      .eq('id', funcionario.id)
    if (error) { console.error(error); setSaving(false); return }
    onSaved()
    onClose()
  }

  return (
    <ModalBase
      title="Calcular Custos"
      subtitle={`Configure os encargos de ${funcionario.nome}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Salário base</p>
            <p className="text-white font-semibold text-sm">{fmt(salario)}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Encargos extras</p>
            <p className="text-amber-400 font-semibold text-sm">{fmt(extras)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Custo total</p>
            <p className="text-white font-bold text-sm">{fmt(custoTotal)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1a1a] rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {tab === 'encargos' && <>
            <p className="text-xs text-gray-600">Configure conforme orientação do contador</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="INSS Empresa (%)">
                <Input type="number" value={form.inss} onChange={e => set('inss', e.target.value)} />
              </FormField>
              <FormField label="FGTS (%)">
                <Input type="number" value={form.fgts} onChange={e => set('fgts', e.target.value)} />
              </FormField>
              <FormField label="RAT (%)">
                <Input type="number" value={form.rat} onChange={e => set('rat', e.target.value)} />
              </FormField>
              <FormField label="Terceiros (%)">
                <Input type="number" value={form.terceiros} onChange={e => set('terceiros', e.target.value)} />
              </FormField>
            </div>
          </>}

          {tab === 'provisoes' && <>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Férias (%)">
                <Input type="number" value={form.ferias} onChange={e => set('ferias', e.target.value)} />
              </FormField>
              <FormField label="13º Salário (%)">
                <Input type="number" value={form.decimo} onChange={e => set('decimo', e.target.value)} />
              </FormField>
            </div>
          </>}

          {tab === 'beneficios' && <>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="Vale Transporte (R$/mês)">
                <Input type="number" value={form.vt} onChange={e => set('vt', e.target.value)} />
              </FormField>
              <FormField label="Vale Refeição (R$/mês)">
                <Input type="number" value={form.vr} onChange={e => set('vr', e.target.value)} />
              </FormField>
              <FormField label="Plano de Saúde (R$/mês)">
                <Input type="number" value={form.plano_saude} onChange={e => set('plano_saude', e.target.value)} />
              </FormField>
            </div>
          </>}

          {tab === 'outros' && <>
            <FormField label="Outros custos (R$/mês)">
              <Input type="number" value={form.outros} onChange={e => set('outros', e.target.value)} />
            </FormField>
          </>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvando...' : 'Salvar custos'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
