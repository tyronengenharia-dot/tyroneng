'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui'
import { ReferenciaItem, ReferenciaVersaoComContagem } from '@/types/referencia'
import { getItens } from '@/services/referenciaService'

interface Props {
  versao: ReferenciaVersaoComContagem
  onClose: () => void
}

const LIMITE_EXIBICAO = 200

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ReferenciaItensModal({ versao, onClose }: Props) {
  const [itens, setItens] = useState<ReferenciaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    getItens(versao.id).then(rows => {
      if (!active) return
      setItens(rows)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [versao])

  const q = search.toLowerCase()
  const filtrados = q
    ? itens.filter(i => i.codigo.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q))
    : itens
  const exibidos = filtrados.slice(0, LIMITE_EXIBICAO)

  const titulo = `${versao.fonte.toUpperCase()} ${String(versao.mes).padStart(2, '0')}/${versao.ano}`
  const sub = [versao.uf, versao.rotulo].filter(Boolean).join(' · ') || `${versao.total_itens} itens`

  return (
    <Modal title={titulo} subtitle={sub} onClose={onClose} width="max-w-3xl">
      <div className="space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código ou descrição..."
          className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
        />

        {loading ? (
          <p className="text-sm text-white/40 py-6 text-center">Carregando itens...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">Nenhum item encontrado.</p>
        ) : (
          <>
            <div className="border border-white/8 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 border-b border-white/8">
                    <th className="text-left px-3 py-2 font-semibold">Código</th>
                    <th className="text-left px-3 py-2 font-semibold">Descrição</th>
                    <th className="text-left px-3 py-2 font-semibold">Un</th>
                    <th className="text-right px-3 py-2 font-semibold">Valor unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {exibidos.map(i => (
                    <tr key={i.id} className="border-t border-white/[0.05]">
                      <td className="px-3 py-2 font-mono text-white/60 whitespace-nowrap">{i.codigo}</td>
                      <td className="px-3 py-2 text-white/80">{i.descricao}</td>
                      <td className="px-3 py-2 text-white/40">{i.unidade}</td>
                      <td className="px-3 py-2 text-right font-mono text-white/80 whitespace-nowrap">
                        {formatCurrency(i.valor_unitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtrados.length > LIMITE_EXIBICAO && (
              <p className="text-xs text-white/30 text-center">
                Mostrando {LIMITE_EXIBICAO} de {filtrados.length} itens — refine a busca para ver mais.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
