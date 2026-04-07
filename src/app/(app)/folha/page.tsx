'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

import { FolhaTable } from '@/components/folha/FolhaTable'
import { FolhaSummary } from '@/components/folha/FolhaSummary'
import { FolhaFilters } from '@/components/folha/FolhaFilters'
import { FolhaAdjustModal } from '@/components/folha/FolhaAdjustModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function FolhaPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [month, setMonth] = useState('2026-03')
  const [loading, setLoading] = useState(true)
  const [openAdjustModal, setOpenAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  async function fetchEmployees() {
    setLoading(true)

    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('status', 'ativo')

    if (error) {
      console.error(error)
      return
    }

    setEmployees(data || [])
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

const [folha, setFolha] = useState<any[]>([])

async function fetchFolha() {
  const { data, error } = await supabase
    .from('folha_mensal')
    .select(`
      *,
      funcionarios (
        nome
      )
    `)
    .eq('mes', month)

  if (error) {
    console.error(error)
    return
  }

  setFolha(data || [])
}

async function fecharMes() {
  await supabase
    .from('folha_mensal')
    .update({ fechado: true })
    .eq('mes', month)

  fetchFolha()
}

useEffect(() => {
  fetchFolha()
}, [month])

  useEffect(() => {
    fetchEmployees()
    
  }, [])

  const filtered = employees

  function exportPDF(data: any[]) {
  const doc = new jsPDF()

  autoTable(doc, {
    head: [['Funcionário', 'Base', 'Extras', 'Total', 'Status']],
    body: data.map(item => {
      const total =
        Number(item.salario_base) +
        Number(item.extras) +
        Number(item.adicional) -
        Number(item.desconto)

      return [
        item.funcionarios?.nome,
        item.salario_base,
        item.extras,
        total,
        item.pago ? 'Pago' : 'Pendente',
      ]
    }),
  })

  doc.save('folha.pdf')
}

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Folha de pagamento
          </h1>
          <p className="text-gray-400 text-sm">
            Controle mensal de salários
          </p>
        </div>
        <button
          onClick={generateFolhaMensal}
          className="bg-green-500 text-white px-4 py-2 rounded-xl"
        >
          Gerar folha do mês
        </button>
        <button
            onClick={fecharMes}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Fechar mês
          </button>
          <button
            onClick={() => exportPDF(folha)}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl"
          >
            Exportar PDF
          </button>

      </div>

      {/* FILTRO (preparado pro futuro) */}
      <FolhaFilters month={month} setMonth={setMonth} />

      {/* CONTENT */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <>
          <FolhaSummary data={filtered} />
          <FolhaTable
              data={folha}
              onUpdate={fetchFolha}
              onOpenAdjust={(item: any) => {
                setSelectedItem(item)
                setOpenAdjustModal(true)
              }}
            />
        </>
      )}

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