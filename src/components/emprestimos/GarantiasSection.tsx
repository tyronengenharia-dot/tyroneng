'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Home, Car, Shield, FileSignature, Landmark } from 'lucide-react'
import { Btn } from '@/components/ui'
import { EmprestimoGarantia, GarantiaTipo } from '@/types/emprestimo'
import { deleteGarantia } from '@/services/emprestimoService'
import {
  garantiaTipoLabels,
  garantiaSituacaoLabels,
  garantiaSituacaoClass,
} from '@/lib/emprestimoConstants'
import { fmtCurrency } from '@/lib/utils'
import { GarantiaModal } from './GarantiaModal'

interface Props {
  emprestimoId: string
  garantias: EmprestimoGarantia[]
  onChanged: () => void
}

function iconFor(tipo: GarantiaTipo) {
  switch (tipo) {
    case 'imovel':
      return Home
    case 'veiculo':
      return Car
    case 'aval':
    case 'fianca':
      return FileSignature
    case 'aplicacao':
      return Landmark
    default:
      return Shield
  }
}

export function GarantiasSection({ emprestimoId, garantias, onChanged }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmprestimoGarantia | null>(null)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(g: EmprestimoGarantia) {
    setEditing(g)
    setModalOpen(true)
  }

  async function handleDelete(g: EmprestimoGarantia) {
    if (!confirm(`Excluir a garantia "${g.descricao}"?`)) return
    const { error } = await deleteGarantia(g.id)
    if (error) {
      alert(error)
      return
    }
    onChanged()
  }

  const totalGarantido = garantias.reduce((a, g) => a + (g.valor_estimado || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-white/40">
          {garantias.length === 0
            ? 'Nenhuma garantia cadastrada.'
            : `${garantias.length} garantia(s) · ${fmtCurrency(totalGarantido)} estimado`}
        </p>
        <Btn variant="ghost" size="sm" onClick={openNew}>
          <Plus size={13} /> Adicionar garantia
        </Btn>
      </div>

      {garantias.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {garantias.map(g => {
            const Icon = iconFor(g.tipo)
            const detalhe =
              g.tipo === 'imovel'
                ? [g.matricula && `Matrícula ${g.matricula}`, g.cartorio].filter(Boolean).join(' · ')
                : g.tipo === 'veiculo'
                  ? [g.placa, g.renavam && `Renavam ${g.renavam}`].filter(Boolean).join(' · ')
                  : g.garantidor || g.documento || ''
            return (
              <div
                key={g.id}
                className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/80 truncate font-medium">{g.descricao}</p>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border flex-shrink-0 ${garantiaSituacaoClass[g.situacao]}`}
                    >
                      {garantiaSituacaoLabels[g.situacao]}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {garantiaTipoLabels[g.tipo]}
                    {g.valor_estimado ? ` · ${fmtCurrency(g.valor_estimado)}` : ''}
                  </p>
                  {detalhe && <p className="text-[10px] text-white/30 mt-0.5 truncate">{detalhe}</p>}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(g)}
                    className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(g)}
                    className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <GarantiaModal
          emprestimoId={emprestimoId}
          garantia={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            onChanged()
          }}
        />
      )}
    </div>
  )
}
