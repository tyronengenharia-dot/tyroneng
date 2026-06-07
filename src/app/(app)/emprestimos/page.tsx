'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { LoadingSpinner, KpiCard, Btn, EmptyState } from '@/components/ui'
import { getEmprestimos, deleteEmprestimo } from '@/services/emprestimoService'
import { getObras } from '@/services/obraService'
import { EmprestimoResumo, EmprestimoCategoria, EmprestimoStatus } from '@/types/emprestimo'
import { Obra } from '@/types'
import { fmtCurrency } from '@/lib/utils'
import { categoriaOptions, statusOptions } from '@/lib/emprestimoConstants'
import { EmprestimoCard } from '@/components/emprestimos/EmprestimoCard'
import { EmprestimoModal } from '@/components/emprestimos/EmprestimoModal'
import { EmprestimoDetalhe } from '@/components/emprestimos/EmprestimoDetalhe'

const inputClass =
  'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoResumo[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmprestimoResumo | null>(null)
  const [detalhe, setDetalhe] = useState<EmprestimoResumo | null>(null)

  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<'todos' | EmprestimoCategoria>('todos')
  const [status, setStatus] = useState<'todos' | EmprestimoStatus>('todos')

  async function refresh() {
    const data = await getEmprestimos()
    setEmprestimos(data)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      const [emp, obs] = await Promise.all([getEmprestimos(), getObras()])
      if (!active) return
      setEmprestimos(emp)
      setObras(obs)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const obraNome = useMemo(() => {
    const map = new Map(obras.map(o => [o.id, o.name]))
    return (id?: string | null) => (id ? map.get(id) : undefined)
  }, [obras])

  const kpis = useMemo(() => {
    const ativos = emprestimos.filter(e => e.status === 'ativo' || e.status === 'contemplado')
    const dividaTotal = ativos.reduce((a, e) => a + Math.max(0, e.saldo_devedor), 0)
    const emAtraso = emprestimos.reduce((a, e) => a + e.valor_em_atraso, 0)
    const qtdAtraso = emprestimos.filter(e => e.valor_em_atraso > 0.005).length
    const totalPago = emprestimos.reduce((a, e) => a + e.total_pago, 0)
    const totalEmprestado = emprestimos.reduce((a, e) => a + e.valor_principal, 0)
    return { dividaTotal, emAtraso, qtdAtraso, totalPago, totalEmprestado, qtdAtivos: ativos.length }
  }, [emprestimos])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    return emprestimos.filter(e => {
      if (
        q &&
        !e.descricao.toLowerCase().includes(q) &&
        !(e.credor ?? '').toLowerCase().includes(q) &&
        !(e.proposito ?? '').toLowerCase().includes(q)
      )
        return false
      if (categoria !== 'todos' && e.categoria !== categoria) return false
      if (status !== 'todos' && e.status !== status) return false
      return true
    })
  }, [emprestimos, busca, categoria, status])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(e: EmprestimoResumo) {
    setEditing(e)
    setModalOpen(true)
  }

  async function handleDelete(e: EmprestimoResumo) {
    if (
      !confirm(
        `Excluir o contrato "${e.descricao}"?\n\nTodas as parcelas e documentos vinculados serão removidos. Esta ação não pode ser desfeita.`
      )
    )
      return
    const { error } = await deleteEmprestimo(e.id)
    if (error) {
      alert(error)
      return
    }
    setDetalhe(null)
    refresh()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Empréstimos &amp; Consórcios</h1>
          <p className="text-gray-400 text-sm">
            Controle completo de contratos, faturas, juros, saldo devedor e documentos.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={openNew}>
          <Plus size={15} /> Novo contrato
        </Btn>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Dívida total"
              value={fmtCurrency(kpis.dividaTotal)}
              sub={`${kpis.qtdAtivos} contrato(s) ativo(s)`}
              variant={kpis.dividaTotal > 0 ? 'red' : 'green'}
            />
            <KpiCard
              label="Em atraso"
              value={fmtCurrency(kpis.emAtraso)}
              sub={kpis.qtdAtraso > 0 ? `${kpis.qtdAtraso} contrato(s)` : 'em dia'}
              variant={kpis.emAtraso > 0 ? 'red' : 'green'}
            />
            <KpiCard label="Pago acumulado" value={fmtCurrency(kpis.totalPago)} sub="todos os contratos" variant="green" />
            <KpiCard label="Total contratado" value={fmtCurrency(kpis.totalEmprestado)} sub="principal / cartas" variant="blue" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar nome, credor, finalidade..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className={`${inputClass} pl-9 w-64`}
              />
            </div>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value as 'todos' | EmprestimoCategoria)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="todos" className="bg-[#111]">Todas as categorias</option>
              {categoriaOptions.map(o => (
                <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'todos' | EmprestimoStatus)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="todos" className="bg-[#111]">Todos os status</option>
              {statusOptions.map(o => (
                <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
              ))}
            </select>
          </div>

          {/* Lista */}
          {filtrados.length === 0 ? (
            <EmptyState
              message={
                emprestimos.length === 0
                  ? 'Nenhum contrato cadastrado. Clique em "Novo contrato" para começar.'
                  : 'Nenhum contrato encontrado para os filtros.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtrados.map(e => (
                <EmprestimoCard
                  key={e.id}
                  emprestimo={e}
                  obraNome={obraNome(e.obra_id)}
                  onOpen={() => setDetalhe(e)}
                  onEdit={() => openEdit(e)}
                  onDelete={() => handleDelete(e)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <EmprestimoModal
          emprestimo={editing}
          obras={obras}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            refresh()
          }}
        />
      )}

      {detalhe && (
        <EmprestimoDetalhe
          emprestimo={detalhe}
          obraNome={obraNome(detalhe.obra_id)}
          onClose={() => setDetalhe(null)}
          onEdit={() => {
            setEditing(detalhe)
            setDetalhe(null)
            setModalOpen(true)
          }}
          onDelete={() => handleDelete(detalhe)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
