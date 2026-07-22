'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createSolicitacoesFromInsumos,
  getEstoquePorInsumo,
  type SolicitacaoInsumoInput,
} from '@/services/comprasFromListaService'
import { UrgenciaSolicitacao } from '@/types/compras'
import { LinhaInsumo, TIPO_LABEL } from '@/lib/listaCompras'
import { Modal, Btn, Input, Select } from '@/components/ui'
import { fmtCurrency, cn } from '@/lib/utils'

type Props = {
  obra_id: string
  obra_nome?: string
  contexto: string
  insumos: LinhaInsumo[]
  dataNecessariaDefault?: string
  onClose: () => void
  onDone: (criadas: number) => void
}

const fmtQty = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// Transforma as linhas de insumo da Lista de Compras em solicitações de compra
// (uma por insumo, destino depósito). Opcionalmente desconta o que já está em
// estoque, solicitando só a diferença. Ver comprasFromListaService.

export function GerarSolicitacaoModal({
  obra_id, obra_nome, contexto, insumos, dataNecessariaDefault, onClose, onDone,
}: Props) {
  const [solicitante, setSolicitante] = useState('')
  const [urgencia, setUrgencia] = useState<UrgenciaSolicitacao>('media')
  const [dataNecessaria, setDataNecessaria] = useState(dataNecessariaDefault ?? '')
  const [observacoes, setObservacoes] = useState('')
  const [descontar, setDescontar] = useState(false)
  const [estoque, setEstoque] = useState<Map<string, number>>(new Map())
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getEstoquePorInsumo(insumos.map(i => i.insumo_id)).then(m => { if (active) setEstoque(m) })
    return () => { active = false }
  }, [insumos])

  const linhas = useMemo(() => insumos.map(i => {
    const necessaria = i.quantidade
    const emEstoque = estoque.get(i.insumo_id) ?? 0
    const aSolicitar = descontar ? Math.max(0, round2(necessaria - emEstoque)) : necessaria
    const incluido = !excluidos.has(i.insumo_id) && aSolicitar > 0
    return { insumo: i, necessaria, emEstoque, aSolicitar, incluido }
  }), [insumos, estoque, descontar, excluidos])

  const selecionadas = linhas.filter(l => l.incluido)
  const valorEstimado = selecionadas.reduce((s, l) => s + l.aSolicitar * l.insumo.valor_unitario, 0)
  const podeCriar = solicitante.trim() !== '' && dataNecessaria !== '' && selecionadas.length > 0

  function toggle(id: string) {
    setExcluidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!podeCriar) {
      toast.error('Informe o solicitante, a data necessária e ao menos um item.')
      return
    }
    setSaving(true)
    const payloadInsumos: SolicitacaoInsumoInput[] = selecionadas.map(l => ({
      insumo_id: l.insumo.insumo_id,
      tipo: l.insumo.tipo,
      descricao: l.insumo.descricao,
      unidade: l.insumo.unidade,
      quantidade: l.aSolicitar,
    }))
    const { criadas, degradado, error } = await createSolicitacoesFromInsumos({
      obra_id, obra_nome,
      solicitante: solicitante.trim(),
      urgencia, data_necessaria: dataNecessaria,
      observacoes: observacoes.trim() || undefined,
      insumos: payloadInsumos,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success(`${criadas} solicitação(ões) de compra criada(s).`)
    if (degradado) toast.warning('Criadas sem vínculo ao catálogo — aplique as migrações 0011/0012.')
    onDone(criadas)
  }

  return (
    <Modal
      title="Gerar solicitação de compra"
      subtitle={`${contexto} · ${insumos.length} insumo(s) · destino depósito`}
      width="max-w-2xl"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleCreate} disabled={saving || !podeCriar}>
            {saving ? 'Criando…' : `Criar ${selecionadas.length} solicitação(ões)`}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Solicitante" required placeholder="Quem está pedindo"
          value={solicitante} onChange={e => setSolicitante(e.target.value)} />
        <Select label="Urgência" value={urgencia}
          onChange={e => setUrgencia(e.target.value as UrgenciaSolicitacao)}
          options={[
            { value: 'baixa', label: 'Baixa' },
            { value: 'media', label: 'Média' },
            { value: 'alta', label: 'Alta' },
            { value: 'critica', label: 'Crítica' },
          ]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Data necessária" required type="date"
          value={dataNecessaria} onChange={e => setDataNecessaria(e.target.value)} />
        <Input label="Observações" placeholder="Opcional"
          value={observacoes} onChange={e => setObservacoes(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-white/70 pt-1">
        <input type="checkbox" checked={descontar} onChange={e => setDescontar(e.target.checked)}
          className="w-4 h-4 accent-white/80" />
        Descontar o que já está em estoque (solicitar só a diferença)
      </label>

      <div className="border border-white/[0.08] rounded-xl overflow-hidden mt-1">
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm" style={{ minWidth: 540 }}>
            <thead className="sticky top-0 bg-[#141414]">
              <tr className="border-b border-white/[0.08]">
                <th className="px-3 py-2 w-8" />
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Insumo</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Necessário</th>
                {descontar && <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Em estoque</th>}
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">A solicitar</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Un.</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr key={l.insumo.insumo_id} className={cn('border-b border-white/[0.04]', !l.incluido && 'opacity-40')}>
                  <td className="px-3 py-1.5">
                    <input type="checkbox" checked={l.incluido} disabled={l.aSolicitar <= 0}
                      onChange={() => toggle(l.insumo.insumo_id)} className="w-4 h-4 accent-white/80" />
                  </td>
                  <td className="px-3 py-1.5 text-white/80">
                    <span className="text-[10px] uppercase tracking-wider text-white/25 mr-2">{TIPO_LABEL[l.insumo.tipo]}</span>
                    {l.insumo.descricao}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-white/50">{fmtQty(l.necessaria)}</td>
                  {descontar && <td className="px-3 py-1.5 text-right font-mono text-white/40">{fmtQty(l.emEstoque)}</td>}
                  <td className="px-3 py-1.5 text-right font-mono text-white/80">{fmtQty(l.aSolicitar)}</td>
                  <td className="px-3 py-1.5 text-white/40 text-xs">{l.insumo.unidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-t border-white/[0.08]">
          <span className="text-xs text-white/40">{selecionadas.length} de {insumos.length} itens</span>
          <span className="text-xs text-white/40">Valor estimado: <span className="font-mono text-green-400">{fmtCurrency(valorEstimado)}</span></span>
        </div>
      </div>

      <p className="text-[11px] text-white/30">
        Isto é o planejamento da compra (base: Custo Planejado). As solicitações entram no módulo de{' '}
        <span className="font-medium text-white/50">Compras</span> como pendentes, com destino ao depósito. Ao
        confirmar a entrega, o estoque e o preço de referência do insumo são atualizados; o gasto efetivo é
        conciliado no Custo Real da obra.
      </p>
    </Modal>
  )
}
