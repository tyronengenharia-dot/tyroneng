'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function EmployeeCostsModal({ employee, onClose, onSaved }: any) {
  const [tab, setTab] = useState('encargos')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Record<string, number>>({
    inss: 20,
    fgts: 8,
    rat: 1,
    terceiros: 5.8,

    ferias: 11.11,
    decimo: 8.33,

    vt: 0,
    vr: 0,
    plano_saude: 0,

    outros: 0,
  })

  async function handleSave() {
    setSaving(true)

    const salario = Number(employee.salario || 0)

    // 🔥 ENCARGOS
    const inssEmpresa = salario * (Number(form.inss) / 100)
    const fgts = salario * (Number(form.fgts) / 100)
    const rat = salario * (Number(form.rat) / 100)
    const terceiros = salario * (Number(form.terceiros) / 100)

    // 🔥 PROVISÕES
    const ferias = salario * (Number(form.ferias) / 100)
    const decimo = salario * (Number(form.decimo) / 100)

    // 🔥 BENEFÍCIOS
    const vt = Number(form.vt)
    const vr = Number(form.vr)
    const plano = Number(form.plano_saude)

    // 🔥 OUTROS
    const outros = Number(form.outros)

    // 🔥 TOTAL
    const extras =
      inssEmpresa +
      fgts +
      rat +
      terceiros +
      ferias +
      decimo +
      vt +
      vr +
      plano +
      outros

    const custo_total = salario + extras

    const { error } = await supabase
      .from('funcionarios')
      .update({
        extras,
        custo_total,
      })
      .eq('id', employee.id)

    if (error) {
      console.error(error)
      setSaving(false)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-lg space-y-4 border border-white/10">

        <h2 className="text-lg font-semibold text-white">
          Custos de {employee.nome}
        </h2>

        <p className="text-sm text-gray-400">
          Configure conforme orientação do contador
        </p>

        {/* TABS */}
        <div className="flex gap-2 flex-wrap">
          {['encargos','provisoes','beneficios','outros'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded ${
                tab === t ? 'bg-white text-black' : 'bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ENCARGOS */}
        {tab === 'encargos' && (
          <>
            <input className="input" placeholder="INSS (%)"
              onChange={e => setForm({...form, inss: Number(e.target.value)})} />

            <input className="input" placeholder="FGTS (%)"
              onChange={e => setForm({...form, fgts: Number(e.target.value)})} />

            <input className="input" placeholder="RAT (%)"
              onChange={e => setForm({...form, rat: Number(e.target.value)})} />

            <input className="input" placeholder="Terceiros (%)"
              onChange={e => setForm({...form, terceiros: Number(e.target.value)})} />
          </>
        )}

        {/* PROVISÕES */}
        {tab === 'provisoes' && (
          <>
            <input className="input" placeholder="Férias (%)"
              onChange={e => setForm({...form, ferias: Number(e.target.value)})} />

            <input className="input" placeholder="13º (%)"
              onChange={e => setForm({...form, decimo: Number(e.target.value)})} />
          </>
        )}

        {/* BENEFÍCIOS */}
        {tab === 'beneficios' && (
          <>
            <input className="input" placeholder="Vale transporte (R$)"
              onChange={e => setForm({...form, vt: Number(e.target.value)})} />

            <input className="input" placeholder="Vale refeição (R$)"
              onChange={e => setForm({...form, vr: Number(e.target.value)})} />

            <input className="input" placeholder="Plano de saúde (R$)"
              onChange={e => setForm({...form, plano_saude: Number(e.target.value)})} />
          </>
        )}

        {/* OUTROS */}
        {tab === 'outros' && (
          <>
            <input className="input" placeholder="Outros custos"
              onChange={e => setForm({...form, outros: Number(e.target.value)})} />
          </>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}