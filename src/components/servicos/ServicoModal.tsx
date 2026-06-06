'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { Insumo } from '@/types/insumo'
import { Servico } from '@/types/servico'
import { getInsumos } from '@/services/insumoService'
import { createServico, updateServico, getComposicao } from '@/services/servicoService'

interface Props {
  servico: Servico | null
  onClose: () => void
  onSaved: () => void
}

type Linha = { insumo: Insumo; coeficiente: string }

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ServicoModal({ servico, onClose, onSaved }: Props) {
  const isEditing = !!servico
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingComp, setLoadingComp] = useState(!!servico)

  const [form, setForm] = useState({
    codigo: servico?.codigo ?? '',
    descricao: servico?.descricao ?? '',
    unidade: servico?.unidade ?? '',
    ativo: servico?.ativo ?? true,
  })
  const [linhas, setLinhas] = useState<Linha[]>([])

  const [catalogo, setCatalogo] = useState<Insumo[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Carrega o catálogo de insumos e (se editando) a composição existente.
  useEffect(() => {
    let active = true
    getInsumos().then(rows => {
      if (active) setCatalogo(rows.filter(i => i.ativo))
    })
    if (servico) {
      getComposicao(servico.id).then(itens => {
        if (!active) return
        setLinhas(
          itens
            .filter(c => c.insumo)
            .map(c => ({ insumo: c.insumo!, coeficiente: String(c.coeficiente) }))
        )
        setLoadingComp(false)
      })
    }
    return () => {
      active = false
    }
  }, [servico])

  const jaAdicionados = new Set(linhas.map(l => l.insumo.id))
  const catalogoFiltrado = catalogo.filter(i => {
    if (jaAdicionados.has(i.id)) return false
    const q = search.toLowerCase()
    return i.codigo.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q)
  })

  const custoTotal = linhas.reduce(
    (s, l) => s + (Number(l.coeficiente) || 0) * l.insumo.valor_unitario,
    0
  )

  function addInsumo(ins: Insumo) {
    setLinhas(prev => [...prev, { insumo: ins, coeficiente: '1' }])
  }
  function removeLinha(insumoId: string) {
    setLinhas(prev => prev.filter(l => l.insumo.id !== insumoId))
  }
  function setCoef(insumoId: string, value: string) {
    setLinhas(prev => prev.map(l => (l.insumo.id === insumoId ? { ...l, coeficiente: value } : l)))
  }

  const baseValido = form.codigo.trim() !== '' && form.descricao.trim() !== '' && form.unidade.trim() !== ''

  async function handleSubmit() {
    if (!baseValido) {
      setError('Preencha código, descrição e unidade.')
      return
    }
    if (linhas.length === 0) {
      setError('Adicione ao menos um insumo à composição.')
      return
    }
    if (!linhas.every(l => Number(l.coeficiente) > 0)) {
      setError('Os coeficientes devem ser maiores que zero.')
      return
    }

    setSaving(true)
    setError(null)

    const base = {
      codigo: form.codigo.trim(),
      descricao: form.descricao.trim(),
      unidade: form.unidade.trim(),
      ativo: form.ativo,
    }
    const itens = linhas.map(l => ({ insumo_id: l.insumo.id, coeficiente: Number(l.coeficiente) }))

    const { error } = isEditing
      ? await updateServico(servico!.id, base, itens)
      : await createServico(base, itens)

    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar serviço' : 'Novo serviço'}
      subtitle={isEditing ? servico!.codigo : 'Composição a partir do catálogo de insumos'}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar serviço'}
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        {/* Dados do serviço */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            required
            placeholder="Ex.: SRV-001"
            value={form.codigo}
            onChange={e => set('codigo', e.target.value)}
          />
          <Input
            label="Unidade"
            required
            placeholder="Ex.: m², m³"
            value={form.unidade}
            onChange={e => set('unidade', e.target.value)}
          />
          <div className="col-span-2">
            <Input
              label="Descrição"
              required
              placeholder="Ex.: Alvenaria de bloco cerâmico"
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
            />
          </div>
          <Select
            label="Situação"
            options={[
              { value: 'true', label: 'Ativo' },
              { value: 'false', label: 'Inativo' },
            ]}
            value={form.ativo ? 'true' : 'false'}
            onChange={e => set('ativo', e.target.value === 'true')}
          />
        </div>

        {/* Composição */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Composição (insumos)</h3>
            <button
              onClick={() => setShowPicker(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus size={13} /> Adicionar insumo
            </button>
          </div>

          {showPicker && (
            <div className="border border-white/10 rounded-xl p-3 mb-3 bg-white/[0.02]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar insumo por código ou descrição..."
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 mb-2"
              />
              <div className="max-h-44 overflow-y-auto divide-y divide-white/5">
                {catalogoFiltrado.length === 0 ? (
                  <p className="text-xs text-white/40 py-3 text-center">
                    {catalogo.length === 0
                      ? 'Nenhum insumo ativo no catálogo.'
                      : 'Nenhum insumo disponível para este filtro.'}
                  </p>
                ) : (
                  catalogoFiltrado.map(ins => (
                    <button
                      key={ins.id}
                      onClick={() => addInsumo(ins)}
                      className="w-full flex items-center justify-between gap-3 py-2 px-1 text-left hover:bg-white/5 rounded-md transition-colors"
                    >
                      <span className="text-sm text-white/80 truncate">
                        <span className="font-mono text-white/50">{ins.codigo}</span> {ins.descricao}
                      </span>
                      <span className="text-xs text-white/40 whitespace-nowrap">
                        {ins.unidade} · {formatCurrency(ins.valor_unitario)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {loadingComp ? (
            <p className="text-xs text-white/40 py-3">Carregando composição...</p>
          ) : linhas.length === 0 ? (
            <p className="text-xs text-white/40 py-3">
              Nenhum insumo na composição. Um serviço deve ter ao menos um insumo.
            </p>
          ) : (
            <div className="border border-white/8 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-white/30">
                    <th className="text-left px-3 py-2 font-semibold">Insumo</th>
                    <th className="text-left px-3 py-2 font-semibold">Un</th>
                    <th className="text-right px-3 py-2 font-semibold">Coef.</th>
                    <th className="text-right px-3 py-2 font-semibold">Vlr unit.</th>
                    <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(l => {
                    const subtotal = (Number(l.coeficiente) || 0) * l.insumo.valor_unitario
                    return (
                      <tr key={l.insumo.id} className="border-t border-white/[0.05]">
                        <td className="px-3 py-2 text-white/80">
                          <span className="font-mono text-white/50">{l.insumo.codigo}</span> {l.insumo.descricao}
                        </td>
                        <td className="px-3 py-2 text-white/40">{l.insumo.unidade}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.000001"
                            value={l.coeficiente}
                            onChange={e => setCoef(l.insumo.id, e.target.value)}
                            className="w-20 bg-[#1a1a1a] border border-white/8 rounded-lg px-2 py-1 text-right text-white focus:outline-none focus:border-white/20"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-white/50 font-mono">
                          {formatCurrency(l.insumo.valor_unitario)}
                        </td>
                        <td className="px-3 py-2 text-right text-white/80 font-mono">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            onClick={() => removeLinha(l.insumo.id)}
                            className="w-6 h-6 rounded-md hover:bg-white/8 inline-flex items-center justify-center text-red-400 transition-colors"
                            title="Remover"
                          >
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-white/40 uppercase tracking-wider">Custo unitário</span>
            <span className="text-lg font-semibold text-green-400 font-mono">{formatCurrency(custoTotal)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  )
}
