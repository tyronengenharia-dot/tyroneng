'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function FolhaAdjustModal({ item, onClose, onSaved }: any) {
  const [tipo, setTipo] = useState<'adicional' | 'desconto'>('adicional')
  const [valor, setValor] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)

    const value = Number(valor)

    const updateData: any = {
      observacao: obs,
    }

    if (tipo === 'adicional') {
      updateData.adicional = (item.adicional || 0) + value
    } else {
      updateData.desconto = (item.desconto || 0) + value
    }

    const { error } = await supabase
      .from('folha_mensal')
      .update(updateData)
      .eq('id', item.id)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">

        <h2 className="text-lg font-semibold text-white">
          Ajustar {item.funcionarios?.nome}
        </h2>

        {/* TIPO */}
        <div className="flex gap-2">
          <button
            onClick={() => setTipo('adicional')}
            className={`px-3 py-1 rounded ${
              tipo === 'adicional' ? 'bg-green-500 text-white' : 'bg-white/10'
            }`}
          >
            Acréscimo
          </button>

          <button
            onClick={() => setTipo('desconto')}
            className={`px-3 py-1 rounded ${
              tipo === 'desconto' ? 'bg-red-500 text-white' : 'bg-white/10'
            }`}
          >
            Desconto
          </button>
        </div>

        {/* VALOR */}
        <input
          type="number"
          placeholder="Valor"
          className="input"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        {/* OBS */}
        <textarea
          placeholder="Motivo (ex: falta, bônus, hora extra...)"
          className="input"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}