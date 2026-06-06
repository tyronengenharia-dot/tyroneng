'use client'

import { useEffect, useState } from 'react'
import { Modal, Btn } from '@/components/ui'
import { getServicos } from '@/services/servicoService'
import { getVersoes, getItens } from '@/services/referenciaService'
import { ServicoComCusto } from '@/types/servico'
import { ReferenciaItem, ReferenciaVersaoComContagem } from '@/types/referencia'

// O que o picker devolve: snapshot + vínculo de origem (Regra 4).
export type SelecaoItem = {
  origem: 'servico' | 'sinapi' | 'emop'
  servico_id: string | null
  referencia_item_id: string | null
  codigo: string
  descricao: string
  unidade: string
  valor_unitario: number
}

type Aba = 'servico' | 'sinapi' | 'emop'

const abas: { value: Aba; label: string }[] = [
  { value: 'servico', label: 'Serviços' },
  { value: 'sinapi', label: 'SINAPI' },
  { value: 'emop', label: 'EMOP' },
]

const LIMITE = 200

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function versaoLabel(v: ReferenciaVersaoComContagem) {
  const m = String(v.mes).padStart(2, '0')
  const extra = [v.uf, v.rotulo].filter(Boolean).join(' ')
  return `${m}/${v.ano}${extra ? ' · ' + extra : ''} (${v.total_itens})`
}

interface Props {
  onClose: () => void
  onSelect: (sel: SelecaoItem) => void
}

export function SelecionarItemModal({ onClose, onSelect }: Props) {
  const [aba, setAba] = useState<Aba>('servico')
  const [search, setSearch] = useState('')

  const [servicos, setServicos] = useState<ServicoComCusto[]>([])
  const [versoes, setVersoes] = useState<ReferenciaVersaoComContagem[]>([])
  const [loadingCat, setLoadingCat] = useState(true)

  const [versaoSel, setVersaoSel] = useState('')
  const [itensRef, setItensRef] = useState<ReferenciaItem[]>([])
  const [itensVersao, setItensVersao] = useState('')

  // Carrega os catálogos uma vez.
  useEffect(() => {
    let active = true
    Promise.all([getServicos(), getVersoes()]).then(([s, v]) => {
      if (!active) return
      setServicos(s)
      setVersoes(v)
      setLoadingCat(false)
    })
    return () => {
      active = false
    }
  }, [])

  const versoesDaFonte = aba === 'servico' ? [] : versoes.filter(v => v.fonte === aba)
  // Default derivado (sem setState em efeito): a versão mais recente da fonte.
  const versaoEfetiva =
    versaoSel && versoesDaFonte.some(v => v.id === versaoSel)
      ? versaoSel
      : versoesDaFonte[0]?.id ?? ''

  // Carrega os itens da versão de referência selecionada.
  useEffect(() => {
    if (!versaoEfetiva) return
    let active = true
    getItens(versaoEfetiva).then(rows => {
      if (!active) return
      setItensRef(rows)
      setItensVersao(versaoEfetiva)
    })
    return () => {
      active = false
    }
  }, [versaoEfetiva])

  const loadingItens = aba !== 'servico' && !!versaoEfetiva && itensVersao !== versaoEfetiva

  const q = search.toLowerCase()
  const servicosFiltrados = servicos
    .filter(s => s.codigo.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q))
    .slice(0, LIMITE)

  const itensDaVersao = itensVersao === versaoEfetiva ? itensRef : []
  const itensFiltrados = itensDaVersao
    .filter(i => i.codigo.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q))
    .slice(0, LIMITE)

  function escolherServico(s: ServicoComCusto) {
    onSelect({
      origem: 'servico',
      servico_id: s.id,
      referencia_item_id: null,
      codigo: s.codigo,
      descricao: s.descricao,
      unidade: s.unidade,
      valor_unitario: s.custo_unitario,
    })
  }

  function escolherRef(i: ReferenciaItem) {
    onSelect({
      origem: aba,
      servico_id: null,
      referencia_item_id: i.id,
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      valor_unitario: i.valor_unitario,
    })
  }

  return (
    <Modal
      title="Adicionar item"
      subtitle="Selecione de Serviços, SINAPI ou EMOP — sem digitação livre"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <Btn variant="ghost" size="md" onClick={onClose}>
          Fechar
        </Btn>
      }
    >
      <div className="space-y-3">
        {/* Abas de fonte */}
        <div className="flex gap-2">
          {abas.map(a => (
            <button
              key={a.value}
              onClick={() => setAba(a.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                aba === a.value
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Controles: versão (referência) + busca */}
        <div className="flex gap-2">
          {aba !== 'servico' && (
            <select
              value={versaoEfetiva}
              onChange={e => setVersaoSel(e.target.value)}
              disabled={versoesDaFonte.length === 0}
              className="bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 disabled:opacity-50 cursor-pointer"
            >
              {versoesDaFonte.length === 0 ? (
                <option value="">Nenhuma versão importada</option>
              ) : (
                versoesDaFonte.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#111]">
                    {versaoLabel(v)}
                  </option>
                ))
              )}
            </select>
          )}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="flex-1 bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Lista */}
        <div className="border border-white/8 rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {loadingCat ? (
              <p className="text-sm text-white/40 py-8 text-center">Carregando catálogos...</p>
            ) : aba === 'servico' ? (
              servicosFiltrados.length === 0 ? (
                <p className="text-sm text-white/40 py-8 text-center">
                  {servicos.length === 0 ? 'Nenhum serviço cadastrado.' : 'Nenhum serviço encontrado.'}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {servicosFiltrados.map(s => (
                      <tr
                        key={s.id}
                        onClick={() => escolherServico(s)}
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-white/50 whitespace-nowrap">{s.codigo}</td>
                        <td className="px-3 py-2 text-white/80">{s.descricao}</td>
                        <td className="px-3 py-2 text-white/40 whitespace-nowrap">{s.unidade}</td>
                        <td className="px-3 py-2 text-right font-mono text-green-400 whitespace-nowrap">
                          {formatCurrency(s.custo_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : loadingItens ? (
              <p className="text-sm text-white/40 py-8 text-center">Carregando itens...</p>
            ) : versoesDaFonte.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">
                Nenhuma tabela {aba.toUpperCase()} importada. Importe em Referências.
              </p>
            ) : itensFiltrados.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">Nenhum item encontrado.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {itensFiltrados.map(i => (
                    <tr
                      key={i.id}
                      onClick={() => escolherRef(i)}
                      className="border-b border-white/[0.05] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-white/50 whitespace-nowrap">{i.codigo}</td>
                      <td className="px-3 py-2 text-white/80">{i.descricao}</td>
                      <td className="px-3 py-2 text-white/40 whitespace-nowrap">{i.unidade}</td>
                      <td className="px-3 py-2 text-right font-mono text-white/80 whitespace-nowrap">
                        {formatCurrency(i.valor_unitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <p className="text-xs text-white/30">Clique em uma linha para adicionar o item à planilha.</p>
      </div>
    </Modal>
  )
}
