'use client'

import { useMemo, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  Search,
} from 'lucide-react'
import {
  Btn,
  TableCard,
  TableHead,
  Th,
  Td,
  EmptyState,
} from '@/components/ui'
import {
  MovimentacaoComRelacoes,
  ContaComSaldo,
  BancoCategoria,
  BancoMovimentacao,
  MovTipo,
  MovStatus,
} from '@/types/banco'
import { Obra } from '@/types'
import {
  deleteMovimentacao,
  excluirTransferencia,
  conciliarMovimentacao,
} from '@/services/bancoService'
import { movStatusLabels, movStatusClass } from '@/lib/bancoConstants'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import { MovimentacaoModal } from './MovimentacaoModal'

interface Props {
  movimentacoes: MovimentacaoComRelacoes[]
  contas: ContaComSaldo[]
  categorias: BancoCategoria[]
  obras: Obra[]
  onRefresh: () => void
  onTransferir: () => void
  contaInicial?: string
}

const inputClass =
  'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

const PER_PAGE = 12

function hoje() {
  return new Date().toLocaleDateString('en-CA')
}

export function MovimentacoesTab({
  movimentacoes,
  contas,
  categorias,
  obras,
  onRefresh,
  onTransferir,
  contaInicial,
}: Props) {
  const [busca, setBusca] = useState('')
  const [contaId, setContaId] = useState(contaInicial ?? 'todas')
  const [tipo, setTipo] = useState<'todos' | MovTipo>('todos')
  const [status, setStatus] = useState<'todos' | MovStatus>('todos')
  const [categoriaId, setCategoriaId] = useState('todas')
  const [obraId, setObraId] = useState('todas')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)

  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<BancoMovimentacao | null>(null)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase()
    return movimentacoes.filter(m => {
      if (
        q &&
        !m.descricao.toLowerCase().includes(q) &&
        !(m.beneficiario ?? '').toLowerCase().includes(q) &&
        !(m.documento ?? '').toLowerCase().includes(q)
      )
        return false
      if (contaId !== 'todas' && m.conta_id !== contaId) return false
      if (tipo !== 'todos' && m.tipo !== tipo) return false
      if (status !== 'todos' && m.status !== status) return false
      if (categoriaId !== 'todas' && m.categoria_id !== categoriaId) return false
      if (obraId !== 'todas' && m.obra_id !== obraId) return false
      if (dataInicio && m.data < dataInicio) return false
      if (dataFim && m.data > dataFim) return false
      return true
    })
  }, [movimentacoes, busca, contaId, tipo, status, categoriaId, obraId, dataInicio, dataFim])

  const totEntradas = filtradas
    .filter(m => m.tipo === 'entrada')
    .reduce((a, m) => a + m.valor, 0)
  const totSaidas = filtradas
    .filter(m => m.tipo === 'saida')
    .reduce((a, m) => a + m.valor, 0)
  const resultado = totEntradas - totSaidas

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PER_PAGE))
  const pageSafe = Math.min(page, totalPages)
  const pagina = filtradas.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE)

  function openNew() {
    setEditing(null)
    setOpenModal(true)
  }
  function openEdit(m: BancoMovimentacao) {
    setEditing(m)
    setOpenModal(true)
  }

  async function handleConciliar(m: MovimentacaoComRelacoes) {
    const { error } = await conciliarMovimentacao(m.id, hoje())
    if (error) {
      alert(error)
      return
    }
    onRefresh()
  }

  async function handleDelete(m: MovimentacaoComRelacoes) {
    if (m.transferencia_id) {
      if (
        !confirm(
          'Esta movimentação faz parte de uma transferência. As duas pernas (saída e entrada) serão excluídas. Continuar?'
        )
      )
        return
      const { error } = await excluirTransferencia(m.transferencia_id)
      if (error) {
        alert(error)
        return
      }
      onRefresh()
      return
    }
    if (!confirm(`Excluir a movimentação "${m.descricao}"?`)) return
    const { error } = await deleteMovimentacao(m.id)
    if (error) {
      alert(error)
      return
    }
    onRefresh()
  }

  const semContas = contas.length === 0

  return (
    <div className="space-y-4">
      {/* Ações */}
      <div className="flex items-center justify-end gap-2">
        <Btn variant="ghost" size="md" onClick={onTransferir} disabled={contas.length < 2}>
          <ArrowRightLeft size={15} /> Transferência
        </Btn>
        <Btn variant="primary" size="md" onClick={openNew} disabled={semContas}>
          <Plus size={15} /> Nova movimentação
        </Btn>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar descrição, fornecedor, NF..."
            value={busca}
            onChange={e => resetPage(setBusca)(e.target.value)}
            className={`${inputClass} pl-9 w-56`}
          />
        </div>

        <select value={contaId} onChange={e => resetPage(setContaId)(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="todas" className="bg-[#111]">Todas as contas</option>
          {contas.map(c => (
            <option key={c.id} value={c.id} className="bg-[#111]">{c.nome}</option>
          ))}
        </select>

        <select value={tipo} onChange={e => resetPage(setTipo)(e.target.value as 'todos' | MovTipo)} className={`${inputClass} cursor-pointer`}>
          <option value="todos" className="bg-[#111]">Entradas e saídas</option>
          <option value="entrada" className="bg-[#111]">Só entradas</option>
          <option value="saida" className="bg-[#111]">Só saídas</option>
        </select>

        <select value={status} onChange={e => resetPage(setStatus)(e.target.value as 'todos' | MovStatus)} className={`${inputClass} cursor-pointer`}>
          <option value="todos" className="bg-[#111]">Todos os status</option>
          <option value="previsto" className="bg-[#111]">Previsto</option>
          <option value="pago" className="bg-[#111]">Pago</option>
          <option value="conciliado" className="bg-[#111]">Conciliado</option>
        </select>

        <select value={categoriaId} onChange={e => resetPage(setCategoriaId)(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="todas" className="bg-[#111]">Todas as categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id} className="bg-[#111]">{c.nome}</option>
          ))}
        </select>

        <select value={obraId} onChange={e => resetPage(setObraId)(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="todas" className="bg-[#111]">Todas as obras</option>
          {obras.map(o => (
            <option key={o.id} value={o.id} className="bg-[#111]">{o.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input type="date" value={dataInicio} onChange={e => resetPage(setDataInicio)(e.target.value)} className={inputClass} />
          <span className="text-white/20 text-sm">→</span>
          <input type="date" value={dataFim} onChange={e => resetPage(setDataFim)(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Totais do filtro */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Entradas (filtro)</p>
          <p className="text-base font-semibold text-emerald-400 tabular-nums">{fmtCurrency(totEntradas)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Saídas (filtro)</p>
          <p className="text-base font-semibold text-red-400 tabular-nums">{fmtCurrency(totSaidas)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Resultado (filtro)</p>
          <p className={`text-base font-semibold tabular-nums ${resultado >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmtCurrency(resultado)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      {filtradas.length === 0 ? (
        <EmptyState
          message={
            movimentacoes.length === 0
              ? semContas
                ? 'Cadastre uma conta antes de lançar movimentações.'
                : 'Nenhuma movimentação lançada ainda.'
              : 'Nenhuma movimentação encontrada para os filtros.'
          }
        />
      ) : (
        <>
          <TableCard>
            <table className="w-full">
              <TableHead>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th>Conta</Th>
                <Th>Categoria</Th>
                <Th right>Valor</Th>
                <Th>Status</Th>
                <Th right>Ações</Th>
              </TableHead>
              <tbody>
                {pagina.map(m => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors align-top">
                    <Td mono muted>{fmtDate(m.data)}</Td>
                    <td className="px-5 py-3.5 text-sm border-t border-white/[0.05]">
                      <div className="text-white/80">{m.descricao}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {m.beneficiario && (
                          <span className="text-[10px] text-white/40">{m.beneficiario}</span>
                        )}
                        {m.obra && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                            🏗 {m.obra.name}
                          </span>
                        )}
                        {m.transferencia_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                            ⇄ transferência
                          </span>
                        )}
                        {m.documento && (
                          <span className="text-[10px] text-white/30 font-mono">NF {m.documento}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm border-t border-white/[0.05]">
                      <span className="inline-flex items-center gap-1.5 text-white/60">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.conta?.cor ?? '#6b7280' }} />
                        {m.conta?.nome ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm border-t border-white/[0.05]">
                      {m.categoria ? (
                        <span className="inline-flex items-center gap-1.5 text-white/60 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.categoria.cor }} />
                          {m.categoria.nome}
                        </span>
                      ) : (
                        <span className="text-white/25 text-xs">—</span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-sm border-t border-white/[0.05] text-right font-mono font-semibold ${
                      m.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {m.tipo === 'entrada' ? '+' : '−'} {fmtCurrency(m.valor)}
                    </td>
                    <td className="px-5 py-3.5 border-t border-white/[0.05]">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${movStatusClass[m.status]}`}>
                        {movStatusLabels[m.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 border-t border-white/[0.05]">
                      <div className="flex items-center justify-end gap-1">
                        {m.status !== 'conciliado' && (
                          <button
                            onClick={() => handleConciliar(m)}
                            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-green-400 transition-colors"
                            title="Conciliar"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {!m.transferencia_id && (
                          <button
                            onClick={() => openEdit(m)}
                            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m)}
                          className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">
                {filtradas.length} movimentaç{filtradas.length === 1 ? 'ão' : 'ões'}
              </span>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}>
                  Anterior
                </Btn>
                <span className="text-xs text-white/50">
                  {pageSafe} / {totalPages}
                </span>
                <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>
                  Próxima
                </Btn>
              </div>
            </div>
          )}
        </>
      )}

      {openModal && (
        <MovimentacaoModal
          movimentacao={editing}
          contas={contas}
          categorias={categorias}
          obras={obras}
          defaultContaId={contaId !== 'todas' ? contaId : undefined}
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            setOpenModal(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
