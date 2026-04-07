'use client'

import { useEffect, useState } from 'react'
import {
  getFinancialRecords,
  deleteFinancialRecord,
} from '@/services/financialService'
import { FinancialRecord } from '@/types/financial'

import { FinanceTable } from '@/components/financeiro/FinanceTable'
import { FinancePagination } from '@/components/financeiro/FinancePagination'
import { FinanceModal } from '@/components/financeiro/FinanceModal'
import { FolhaTab } from '@/components/folha/FolhaTab'
import { NotasTab } from '@/components/notas-fiscais/NotasTab'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ─── sub-components locais ───────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-white rounded-full" />
      )}
    </button>
  )
}

function MetricCard({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${valueClass ?? 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

type Tab = 'transacoes' | 'folha' | 'notas'

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<Tab>('transacoes')

  const [data, setData] = useState<FinancialRecord[]>([])
  const [filtered, setFiltered] = useState<FinancialRecord[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<FinancialRecord | null>(null)

  const limit = 8

  async function fetchData() {
    setLoading(true)
    const { data: records } = await getFinancialRecords()
    setData(records)
    setFiltered(records)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let result = [...data]
    if (search) result = result.filter(i => i.description.toLowerCase().includes(search.toLowerCase()))
    if (type !== 'todos') result = result.filter(i => i.type === type)
    if (status !== 'todos') result = result.filter(i => i.status === status)
    if (startDate) result = result.filter(i => i.date >= startDate)
    if (endDate) result = result.filter(i => i.date <= endDate)
    setFiltered(result)
    setPage(1)
  }, [search, type, status, startDate, endDate, data])

  const totalPages = Math.ceil(filtered.length / limit)
  const paginatedData = filtered.slice((page - 1) * limit, page * limit)

  const entradas = data.filter(i => i.type === 'entrada').reduce((acc, i) => acc + i.value, 0)
  const saidas = data.filter(i => i.type === 'saida').reduce((acc, i) => acc + i.value, 0)
  const saldo = entradas - saidas
  const aReceber = data.filter(i => i.status === 'pendente').reduce((acc, i) => acc + i.value, 0)

  const inputClass =
    'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white">Financeiro</h1>
          <p className="text-sm text-white/40 mt-1">
            Controle completo de receitas, despesas, folha de pagamento e notas fiscais
          </p>
        </div>

        {activeTab === 'transacoes' && (
          <button
            onClick={() => { setEditing(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span className="text-base leading-none">+</span>
            Nova transação
          </button>
        )}
      </div>

      {/* MÉTRICAS — só na aba transações */}
      {activeTab === 'transacoes' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Receitas totais" value={`R$ ${fmt(entradas)}`} valueClass="text-emerald-400" />
          <MetricCard label="Despesas totais" value={`R$ ${fmt(saidas)}`} valueClass="text-red-400" />
          <MetricCard label="Saldo atual" value={`R$ ${fmt(saldo)}`} valueClass={saldo >= 0 ? 'text-white' : 'text-red-400'} />
          <MetricCard label="A receber" value={`R$ ${fmt(aReceber)}`} valueClass="text-amber-400" />
        </div>
      )}

      {/* ABAS */}
      <div className="border-b border-white/[0.07]">
        <div className="flex">
          <TabButton active={activeTab === 'transacoes'} onClick={() => setActiveTab('transacoes')}>
            Transações
          </TabButton>
          <TabButton active={activeTab === 'folha'} onClick={() => setActiveTab('folha')}>
            Folha de Pagamento
          </TabButton>
          <TabButton active={activeTab === 'notas'} onClick={() => setActiveTab('notas')}>
            Notas Fiscais
          </TabButton>
        </div>
      </div>

      {/* ABA TRANSAÇÕES */}
      {activeTab === 'transacoes' && (
        <>
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar transação..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${inputClass} pl-9 w-52`}
                />
              </div>

              <div className="flex gap-1">
                {['todos', 'entrada', 'saida'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3.5 py-2 rounded-xl text-sm transition-colors ${
                      type === t
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                <span className="text-white/20 text-sm">→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              </div>

              <div className="flex gap-1">
                {['todos', 'pago', 'pendente'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3.5 py-2 rounded-xl text-sm transition-colors ${
                      status === s
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 text-center text-white/40 text-sm">
              Carregando transações...
            </div>
          ) : data.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-16 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-lg font-semibold text-white mb-2">Nenhuma transação ainda</h2>
              <p className="text-sm text-white/40 mb-6">Comece registrando sua primeira entrada ou despesa</p>
              <button
                onClick={() => { setEditing(null); setOpenModal(true) }}
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                + Nova transação
              </button>
            </div>
          ) : (
            <>
              <FinanceTable
                data={paginatedData}
                onEdit={item => { setEditing(item); setOpenModal(true) }}
                onDelete={async id => { await deleteFinancialRecord(id); fetchData() }}
              />
              <FinancePagination page={page} setPage={setPage} totalPages={totalPages} />
            </>
          )}
        </>
      )}

      {/* ABA FOLHA */}
      {activeTab === 'folha' && <FolhaTab />}

      {/* ABA NOTAS FISCAIS */}
      {activeTab === 'notas' && <NotasTab />}

      {/* MODAL TRANSAÇÃO */}
      {openModal && (
        <FinanceModal
          initialData={editing}
          onClose={() => setOpenModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}