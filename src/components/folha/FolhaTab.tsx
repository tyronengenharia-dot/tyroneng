'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FolhaTable } from '@/components/folha/FolhaTable'
import { FolhaSummary } from '@/components/folha/FolhaSummary'
import { FolhaAdjustModal } from '@/components/folha/FolhaAdjustModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const inputClass =
  'bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

export function FolhaTab() {
  const [month, setMonth] = useState(currentMonth())
  const [folha, setFolha] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openAdjustModal, setOpenAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  async function fetchFolha() {
    setLoading(true)
    const { data, error } = await supabase
      .from('folha_mensal')
      .select(`*, funcionarios (nome)`)
      .eq('mes', month)
    if (!error) setFolha(data || [])
    setLoading(false)
  }

  async function generateFolhaMensal() {
    const { data: existing } = await supabase
      .from('folha_mensal')
      .select('id')
      .eq('mes', month)
      .limit(1)

    if (existing && existing.length > 0) {
      alert('Folha já gerada para esse mês!')
      return
    }

    const { data: employees } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('status', 'ativo')

    if (!employees) return

    for (const emp of employees) {
      await supabase.from('folha_mensal').insert([
        {
          funcionario_id: emp.id,
          mes: month,
          salario_base: emp.salario,
          extras: emp.extras || 0,
          custo_total: emp.custo_total || emp.salario,
        },
      ])
    }

    fetchFolha()
  }

  async function fecharMes() {
    if (!confirm('Fechar o mês? Essa ação bloqueia edições.')) return
    await supabase
      .from('folha_mensal')
      .update({ fechado: true })
      .eq('mes', month)
    fetchFolha()
  }

  function exportPDF() {
    const doc = new jsPDF()
    autoTable(doc, {
      head: [['Funcionário', 'Base', 'Extras', 'Adicional', 'Desconto', 'Total', 'Status']],
      body: folha.map(item => {
        const total =
          Number(item.salario_base) +
          Number(item.extras) +
          Number(item.adicional || 0) -
          Number(item.desconto || 0)
        return [
          item.funcionarios?.nome,
          fmtCurrency(item.salario_base),
          fmtCurrency(item.extras),
          fmtCurrency(item.adicional || 0),
          fmtCurrency(item.desconto || 0),
          fmtCurrency(total),
          item.pago ? 'Pago' : 'Pendente',
        ]
      }),
    })
    doc.save(`folha-${month}.pdf`)
  }

  useEffect(() => { fetchFolha() }, [month])

  const isFechado = folha.length > 0 && folha.every(i => i.fechado)

  return (
    <div className="space-y-6">

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className={inputClass}
          />
          {isFechado && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1a2 2 0 0 0-2 2v1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H8V3a2 2 0 0 0-2-2zm0 1a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z" />
              </svg>
              Mês fechado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            disabled={folha.length === 0}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-30"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 12h10M8 2v8m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exportar PDF
          </button>

          {!isFechado && folha.length > 0 && (
            <button
              onClick={fecharMes}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1a2 2 0 0 0-2 2v1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H8V3a2 2 0 0 0-2-2zm0 1a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z" />
              </svg>
              Fechar mês
            </button>
          )}

          <button
            onClick={generateFolhaMensal}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span className="text-base leading-none">+</span>
            Gerar folha
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      {folha.length > 0 && <FolhaSummary data={folha} />}

      {/* CONTEÚDO */}
      {loading ? (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 text-center text-white/30 text-sm">
          Carregando...
        </div>
      ) : folha.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-base font-semibold text-white mb-2">Nenhuma folha gerada</h2>
          <p className="text-sm text-white/40 mb-6">
            Clique em "Gerar folha" para criar a folha deste mês
          </p>
          <button
            onClick={generateFolhaMensal}
            className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Gerar folha do mês
          </button>
        </div>
      ) : (
        <FolhaTable
          data={folha}
          onUpdate={fetchFolha}
          onOpenAdjust={(item: any) => {
            setSelectedItem(item)
            setOpenAdjustModal(true)
          }}
        />
      )}

      {/* MODAL AJUSTE */}
      {openAdjustModal && selectedItem && (
        <FolhaAdjustModal
          item={selectedItem}
          onClose={() => setOpenAdjustModal(false)}
          onSaved={fetchFolha}
        />
      )}
    </div>
  )
}