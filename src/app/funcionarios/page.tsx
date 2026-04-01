'use client'

import { useEffect, useState } from 'react'
import { Employee } from '@/types/employee'
import { supabase } from '@/lib/supabaseClient'

import { EmployeeTable } from '@/components/funcionarios/EmployeeTable'
import { EmployeeModal } from '@/components/funcionarios/EmployeeModal'
import { EmployeeFilters } from '@/components/funcionarios/EmployeeFilters'
import { EmployeeCostsModal } from '@/components/funcionarios/EmployeeCostsModal'

export default function FuncionariosPage() {
  const [data, setData] = useState<Employee[]>([])
  const [filtered, setFiltered] = useState<Employee[]>([])
  const [status, setStatus] = useState('todos')
  const [loading, setLoading] = useState(true)

  const [openModal, setOpenModal] = useState(false)
  const [openCostsModal, setOpenCostsModal] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  async function fetchData() {
    setLoading(true)

    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setData(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (status === 'todos') {
      setFiltered(data)
    } else {
      setFiltered(data.filter(i => i.status === status))
    }
  }, [status, data])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Funcionários</h1>
          <p className="text-gray-400 text-sm">
            Gerencie sua equipe e pagamentos
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedEmployee(null)
            setOpenModal(true)
          }}
          className="bg-white text-black px-4 py-2 rounded-xl w-full md:w-auto"
        >
          + Novo funcionário
        </button>
      </div>

      {/* BUSCA */}
      <input
        placeholder="Buscar funcionário..."
        className="input"
        onChange={(e) => {
          const term = e.target.value.toLowerCase()

          setFiltered(
            data.filter(emp =>
              emp.nome.toLowerCase().includes(term)
            )
          )
        }}
      />

      {/* FILTRO */}
      <EmployeeFilters status={status} setStatus={setStatus} />

      {/* CONTENT */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <EmployeeTable
          data={filtered}
          onEdit={(emp: Employee) => {
            setSelectedEmployee(emp)
            setOpenModal(true)
          }}
          onEditCosts={(emp: Employee) => {
            setSelectedEmployee(emp)
            setOpenCostsModal(true)
          }}
          onUpdate={fetchData}
        />
      )}

      {/* MODAL FUNCIONÁRIO */}
      {openModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setOpenModal(false)}
          onSave={async () => {
            await fetchData()
            setOpenModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}

      {/* MODAL CUSTOS */}
      {openCostsModal && selectedEmployee && (
        <EmployeeCostsModal
          employee={selectedEmployee}
          onClose={() => {
            setOpenCostsModal(false)
            setSelectedEmployee(null)
          }}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}