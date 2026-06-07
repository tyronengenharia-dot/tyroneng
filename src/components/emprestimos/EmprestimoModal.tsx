'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import {
  Emprestimo,
  EmprestimoCategoria,
  EmprestimoRegime,
  EmprestimoStatus,
  FormaContemplacao,
  TipoTaxa,
  CredorTipo,
  IndiceCorrecao,
} from '@/types/emprestimo'
import { Obra } from '@/types'
import {
  createEmprestimo,
  updateEmprestimo,
  regenerarParcelas,
} from '@/services/emprestimoService'
import { getContas } from '@/services/bancoService'
import {
  regimeOptions,
  regimeDescricao,
  statusOptions,
  formaContemplacaoOptions,
  tipoTaxaOptions,
  credorTipoOptions,
  indiceCorrecaoOptions,
  CORES,
} from '@/lib/emprestimoConstants'
import {
  gerarParcelas,
  numeroDeParcelas,
  anualParaMensal,
  mensalParaAnual,
  cetMensal,
} from '@/lib/emprestimoCalc'
import { fmtCurrency } from '@/lib/utils'

interface Props {
  emprestimo: Emprestimo | null
  obras: Obra[]
  onClose: () => void
  onSaved: () => void
}

function hoje() {
  return new Date().toLocaleDateString('en-CA')
}

const num = (s: string) => {
  const n = Number(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const sectionClass = 'border border-white/10 rounded-xl p-4 space-y-4 bg-white/[0.02]'
const sectionTitle = 'text-[11px] font-semibold text-white/40 uppercase tracking-wider'

export function EmprestimoModal({ emprestimo, obras, onClose, onSaved }: Props) {
  const isEditing = !!emprestimo
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      const cs = await getContas()
      if (active) setContas(cs.map(c => ({ id: c.id, nome: c.nome })))
    })()
    return () => {
      active = false
    }
  }, [])

  const [form, setForm] = useState({
    categoria: (emprestimo?.categoria ?? 'emprestimo') as EmprestimoCategoria,
    descricao: emprestimo?.descricao ?? '',
    numero_contrato: emprestimo?.numero_contrato ?? '',
    credor: emprestimo?.credor ?? '',
    credor_tipo: (emprestimo?.credor_tipo ?? 'pf') as CredorTipo,
    credor_documento: emprestimo?.credor_documento ?? '',
    proposito: emprestimo?.proposito ?? '',
    valor_principal: emprestimo?.valor_principal?.toString() ?? '',
    data_inicio: emprestimo?.data_inicio ?? hoje(),
    data_assinatura: emprestimo?.data_assinatura ?? '',
    data_limite: emprestimo?.data_limite ?? '',
    dia_vencimento: emprestimo?.dia_vencimento?.toString() ?? '',
    status: (emprestimo?.status ?? 'ativo') as EmprestimoStatus,
    obra_id: emprestimo?.obra_id ?? '',
    conta_id: emprestimo?.conta_id ?? '',
    regime: (emprestimo?.regime ?? 'juros_saldo') as EmprestimoRegime,
    tipo_taxa: (emprestimo?.tipo_taxa ?? 'mensal') as TipoTaxa,
    taxa: (
      (emprestimo?.tipo_taxa === 'anual'
        ? emprestimo?.taxa_juros_anual
        : emprestimo?.taxa_juros_mensal) ?? ''
    ).toString(),
    capitaliza: emprestimo?.capitaliza ?? true,
    carencia_meses: emprestimo?.carencia_meses?.toString() ?? '',
    indice_correcao: (emprestimo?.indice_correcao ?? 'nenhum') as IndiceCorrecao,
    num_parcelas: emprestimo?.num_parcelas?.toString() ?? '',
    iof: emprestimo?.iof?.toString() ?? '',
    tac: emprestimo?.tac?.toString() ?? '',
    seguro: emprestimo?.seguro?.toString() ?? '',
    multa_atraso_pct: emprestimo?.multa_atraso_pct?.toString() ?? '',
    juros_mora_mensal: emprestimo?.juros_mora_mensal?.toString() ?? '',
    taxa_admin_pct: emprestimo?.taxa_admin_pct?.toString() ?? '',
    fundo_reserva_pct: emprestimo?.fundo_reserva_pct?.toString() ?? '',
    grupo: emprestimo?.grupo ?? '',
    cota: emprestimo?.cota ?? '',
    bem_objeto: emprestimo?.bem_objeto ?? '',
    prazo_grupo_meses: emprestimo?.prazo_grupo_meses?.toString() ?? '',
    lance_embutido: emprestimo?.lance_embutido ?? false,
    contemplado: emprestimo?.contemplado ?? false,
    data_contemplacao: emprestimo?.data_contemplacao ?? '',
    forma_contemplacao: (emprestimo?.forma_contemplacao ?? 'nao') as FormaContemplacao,
    valor_lance: emprestimo?.valor_lance?.toString() ?? '',
    cor: emprestimo?.cor ?? CORES[0],
    observacoes: emprestimo?.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleTipoTaxa(novo: TipoTaxa) {
    if (novo === form.tipo_taxa) return
    const v = num(form.taxa)
    const conv = v > 0 ? (novo === 'anual' ? mensalParaAnual(v) : anualParaMensal(v)) : 0
    setForm(f => ({ ...f, tipo_taxa: novo, taxa: conv > 0 ? conv.toFixed(2) : f.taxa }))
  }

  const isConsorcio = form.categoria === 'consorcio'
  const mostraJuros = !isConsorcio && form.regime !== 'sem_juros'
  const mostraNumParcelas = isConsorcio || form.regime !== 'juros_saldo'

  // taxa canônica mensal (a partir do que foi digitado)
  const taxaMensal = useMemo(() => {
    const v = num(form.taxa)
    return form.tipo_taxa === 'anual' ? anualParaMensal(v) : v
  }, [form.taxa, form.tipo_taxa])

  const contratoPreview = useMemo(
    () => ({
      categoria: form.categoria,
      regime: form.regime,
      valor_principal: num(form.valor_principal),
      taxa_juros_mensal: mostraJuros ? taxaMensal : 0,
      capitaliza: form.capitaliza,
      carencia_meses: form.carencia_meses ? Math.round(num(form.carencia_meses)) : 0,
      num_parcelas: form.num_parcelas ? Math.round(num(form.num_parcelas)) : null,
      data_inicio: form.data_inicio || hoje(),
      data_limite: form.data_limite || null,
      dia_vencimento: form.dia_vencimento ? Math.round(num(form.dia_vencimento)) : null,
      taxa_admin_pct: num(form.taxa_admin_pct),
      fundo_reserva_pct: num(form.fundo_reserva_pct),
      iof: num(form.iof),
      tac: num(form.tac),
      seguro: num(form.seguro),
    }),
    [form, taxaMensal, mostraJuros]
  )

  const preview = useMemo(() => {
    if (contratoPreview.valor_principal <= 0) return null
    try {
      const parcelas = gerarParcelas(contratoPreview)
      if (parcelas.length === 0) return null
      const totalPagar = parcelas.reduce((a, p) => a + p.valor_total, 0)
      const totalJuros = parcelas.reduce((a, p) => a + p.valor_juros, 0)
      const cet = cetMensal(contratoPreview, parcelas)
      return {
        n: parcelas.length,
        primeira: parcelas[0].valor_total,
        totalPagar,
        totalJuros,
        cetMensal: cet,
        cetAnual: cet === null ? null : mensalParaAnual(cet),
      }
    } catch {
      return null
    }
  }, [contratoPreview])

  const valido =
    form.descricao.trim() !== '' &&
    num(form.valor_principal) > 0 &&
    form.data_inicio !== '' &&
    (mostraNumParcelas
      ? Math.round(num(form.num_parcelas)) > 0
      : form.data_limite !== '' || Math.round(num(form.num_parcelas)) > 0)

  async function handleSubmit() {
    if (!valido) {
      setError('Preencha o nome, um valor maior que zero, a data de início e o prazo.')
      return
    }
    setSaving(true)
    setError(null)

    const taxaAnual = form.tipo_taxa === 'anual' ? num(form.taxa) : mensalParaAnual(taxaMensal)

    const payload = {
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      numero_contrato: form.numero_contrato.trim() || null,
      credor: form.credor.trim() || null,
      credor_tipo: form.credor_tipo,
      credor_documento: form.credor_documento.trim() || null,
      proposito: form.proposito.trim() || null,
      valor_principal: num(form.valor_principal),
      data_inicio: form.data_inicio,
      data_assinatura: form.data_assinatura || null,
      data_limite: form.data_limite || null,
      dia_vencimento: form.dia_vencimento ? Math.round(num(form.dia_vencimento)) : null,
      status: form.status,
      obra_id: form.obra_id || null,
      conta_id: form.conta_id || null,
      regime: isConsorcio ? ('sem_juros' as EmprestimoRegime) : form.regime,
      tipo_taxa: form.tipo_taxa,
      taxa_juros_mensal: mostraJuros ? Number(taxaMensal.toFixed(4)) : 0,
      taxa_juros_anual: mostraJuros ? Number(taxaAnual.toFixed(4)) : 0,
      capitaliza: form.regime === 'juros_saldo' && !isConsorcio ? form.capitaliza : false,
      carencia_meses: form.carencia_meses ? Math.round(num(form.carencia_meses)) : 0,
      indice_correcao: form.indice_correcao,
      num_parcelas: mostraNumParcelas
        ? Math.round(num(form.num_parcelas))
        : numeroDeParcelas(contratoPreview),
      iof: num(form.iof),
      tac: num(form.tac),
      seguro: num(form.seguro),
      multa_atraso_pct: num(form.multa_atraso_pct),
      juros_mora_mensal: num(form.juros_mora_mensal),
      taxa_admin_pct: isConsorcio ? num(form.taxa_admin_pct) : null,
      fundo_reserva_pct: isConsorcio ? num(form.fundo_reserva_pct) : null,
      grupo: isConsorcio ? form.grupo.trim() || null : null,
      cota: isConsorcio ? form.cota.trim() || null : null,
      bem_objeto: isConsorcio ? form.bem_objeto.trim() || null : null,
      prazo_grupo_meses: isConsorcio && form.prazo_grupo_meses ? Math.round(num(form.prazo_grupo_meses)) : null,
      lance_embutido: isConsorcio ? form.lance_embutido : false,
      contemplado: isConsorcio ? form.contemplado : false,
      data_contemplacao: isConsorcio && form.contemplado ? form.data_contemplacao || null : null,
      forma_contemplacao: isConsorcio ? form.forma_contemplacao : ('nao' as FormaContemplacao),
      valor_lance: isConsorcio && form.valor_lance ? num(form.valor_lance) : null,
      cor: form.cor,
      observacoes: form.observacoes.trim() || null,
    }

    if (isEditing) {
      const { error } = await updateEmprestimo(emprestimo!.id, payload)
      setSaving(false)
      if (error) return setError(error)
      onSaved()
      return
    }

    const { data, error } = await createEmprestimo(payload)
    if (error || !data) {
      setSaving(false)
      return setError(error ?? 'Falha ao criar o contrato.')
    }
    const ger = await regenerarParcelas(data)
    setSaving(false)
    if (ger.error) return setError(ger.error)
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar contrato' : 'Novo empréstimo / consórcio'}
      subtitle="Dados das partes, valores, juros, encargos e prazo"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving || !valido}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar contrato'}
          </Btn>
        </>
      }
    >
      {/* Categoria */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set('categoria', 'emprestimo')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.categoria === 'emprestimo'
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          Empréstimo
        </button>
        <button
          type="button"
          onClick={() => set('categoria', 'consorcio')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.categoria === 'consorcio'
              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          Consórcio
        </button>
      </div>

      {/* Identificação */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Identificação</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nome / apelido do contrato"
              required
              placeholder={isConsorcio ? 'Ex.: Consórcio Honda Civic' : 'Ex.: Empréstimo Tio João'}
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
            />
          </div>
          <Input
            label="Nº do contrato"
            placeholder="Opcional"
            value={form.numero_contrato}
            onChange={e => set('numero_contrato', e.target.value)}
          />
          <Select
            label={isConsorcio ? 'Tipo da administradora' : 'Tipo do credor'}
            options={credorTipoOptions}
            value={form.credor_tipo}
            onChange={e => set('credor_tipo', e.target.value as CredorTipo)}
          />
          <Input
            label={isConsorcio ? 'Administradora' : 'Credor (quem emprestou)'}
            placeholder={isConsorcio ? 'Ex.: Porto Seguro' : 'Ex.: João da Silva'}
            value={form.credor}
            onChange={e => set('credor', e.target.value)}
          />
          <Input
            label={form.credor_tipo === 'pj' ? 'CNPJ' : 'CPF'}
            placeholder="Documento do credor"
            value={form.credor_documento}
            onChange={e => set('credor_documento', e.target.value)}
          />
          <div className="col-span-2">
            <Input
              label="Propósito / finalidade"
              placeholder="Ex.: Capital de giro para a obra do Centro"
              value={form.proposito}
              onChange={e => set('proposito', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Valores e prazo */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Valores e prazo</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={isConsorcio ? 'Valor da carta de crédito (R$)' : 'Valor emprestado (R$)'}
            required
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            value={form.valor_principal}
            onChange={e => set('valor_principal', e.target.value)}
          />
          <Input
            label="Dia de vencimento"
            type="number"
            min={1}
            max={31}
            placeholder="Ex.: 10"
            value={form.dia_vencimento}
            onChange={e => set('dia_vencimento', e.target.value)}
          />
          <Input
            label="Data de início"
            required
            type="date"
            value={form.data_inicio}
            onChange={e => set('data_inicio', e.target.value)}
          />
          <Input
            label="Data de assinatura"
            type="date"
            value={form.data_assinatura}
            onChange={e => set('data_assinatura', e.target.value)}
          />
          <Input
            label={form.regime === 'juros_saldo' && !isConsorcio ? 'Data limite para quitar' : 'Data limite (opcional)'}
            type="date"
            value={form.data_limite}
            onChange={e => set('data_limite', e.target.value)}
          />
        </div>
      </div>

      {/* Juros / cobrança (empréstimo) */}
      {!isConsorcio && (
        <div className={sectionClass}>
          <p className={sectionTitle}>Juros e forma de cobrança</p>
          <Select
            label="Forma de cobrança"
            options={regimeOptions}
            value={form.regime}
            onChange={e => set('regime', e.target.value as EmprestimoRegime)}
          />
          <p className="text-[11px] text-white/40 -mt-2">{regimeDescricao[form.regime]}</p>

          <div className="grid grid-cols-2 gap-4">
            {mostraJuros && (
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Taxa de juros</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Ex.: 2"
                    value={form.taxa}
                    onChange={e => set('taxa', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <div className="flex rounded-xl border border-white/10 overflow-hidden">
                    {tipoTaxaOptions.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleTipoTaxa(o.value as TipoTaxa)}
                        className={`px-2.5 text-xs font-medium transition-colors ${
                          form.tipo_taxa === o.value
                            ? 'bg-white text-black'
                            : 'bg-transparent text-white/50 hover:text-white'
                        }`}
                      >
                        {o.value === 'mensal' ? 'a.m.' : 'a.a.'}
                      </button>
                    ))}
                  </div>
                </div>
                {mostraJuros && num(form.taxa) > 0 && (
                  <p className="text-[10px] text-white/30 mt-1">
                    ≈ {taxaMensal.toFixed(2)}% a.m. · {mensalParaAnual(taxaMensal).toFixed(2)}% a.a.
                  </p>
                )}
              </div>
            )}
            <Input
              label={mostraNumParcelas ? 'Nº de parcelas' : 'Nº de meses (ou use a data limite)'}
              type="number"
              min={1}
              placeholder="Ex.: 12"
              value={form.num_parcelas}
              onChange={e => set('num_parcelas', e.target.value)}
            />
            <Input
              label="Carência (meses só de juros)"
              type="number"
              min={0}
              placeholder="0"
              value={form.carencia_meses}
              onChange={e => set('carencia_meses', e.target.value)}
            />
            <Select
              label="Índice de correção"
              options={indiceCorrecaoOptions}
              value={form.indice_correcao}
              onChange={e => set('indice_correcao', e.target.value as IndiceCorrecao)}
            />
          </div>

          {form.regime === 'juros_saldo' && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.capitaliza}
                onChange={e => set('capitaliza', e.target.checked)}
                className="mt-0.5 accent-blue-500"
              />
              <span className="text-xs text-white/60">
                <span className="font-medium text-white/80">Capitalizar juros não pagos</span> — se uma
                parcela não for paga, o juros entra no saldo e o mês seguinte rende sobre o novo valor
                (juros compostos). É o caso típico de empréstimo entre pessoas.
              </span>
            </label>
          )}
        </div>
      )}

      {/* Encargos do crédito */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Encargos do crédito (entram no CET)</p>
        <div className="grid grid-cols-3 gap-4">
          <Input label="IOF (R$)" type="number" step="0.01" min={0} placeholder="0,00" value={form.iof} onChange={e => set('iof', e.target.value)} />
          <Input label="TAC (R$)" type="number" step="0.01" min={0} placeholder="0,00" value={form.tac} onChange={e => set('tac', e.target.value)} />
          <Input label="Seguro (R$)" type="number" step="0.01" min={0} placeholder="0,00" value={form.seguro} onChange={e => set('seguro', e.target.value)} />
        </div>
      </div>

      {/* Encargos de atraso */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Encargos de atraso</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Multa por atraso (%)"
            type="number"
            step="0.01"
            min={0}
            placeholder="Ex.: 2"
            value={form.multa_atraso_pct}
            onChange={e => set('multa_atraso_pct', e.target.value)}
          />
          <Input
            label="Juros de mora (% ao mês)"
            type="number"
            step="0.01"
            min={0}
            placeholder="Ex.: 1"
            value={form.juros_mora_mensal}
            onChange={e => set('juros_mora_mensal', e.target.value)}
          />
        </div>
        <p className="text-[10px] text-white/30 -mt-1">
          Multa é cobrança única sobre a parcela vencida; a mora é proporcional aos dias de atraso.
        </p>
      </div>

      {/* Consórcio */}
      {isConsorcio && (
        <div className={sectionClass}>
          <p className={sectionTitle}>Consórcio</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Taxa de administração (%)" type="number" step="0.01" min={0} placeholder="Ex.: 17" value={form.taxa_admin_pct} onChange={e => set('taxa_admin_pct', e.target.value)} />
            <Input label="Fundo de reserva (%)" type="number" step="0.01" min={0} placeholder="Ex.: 2" value={form.fundo_reserva_pct} onChange={e => set('fundo_reserva_pct', e.target.value)} />
            <Input label="Nº de parcelas" required type="number" min={1} placeholder="Ex.: 80" value={form.num_parcelas} onChange={e => set('num_parcelas', e.target.value)} />
            <Input label="Prazo do grupo (meses)" type="number" min={1} placeholder="Ex.: 80" value={form.prazo_grupo_meses} onChange={e => set('prazo_grupo_meses', e.target.value)} />
            <Input label="Grupo" placeholder="Nº do grupo" value={form.grupo} onChange={e => set('grupo', e.target.value)} />
            <Input label="Cota" placeholder="Nº da cota" value={form.cota} onChange={e => set('cota', e.target.value)} />
            <div className="col-span-2">
              <Input label="Bem objeto" placeholder="Ex.: Automóvel / Imóvel" value={form.bem_objeto} onChange={e => set('bem_objeto', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.lance_embutido} onChange={e => set('lance_embutido', e.target.checked)} className="accent-purple-500" />
            <span className="text-sm text-white/70">Lance embutido</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.contemplado} onChange={e => set('contemplado', e.target.checked)} className="accent-purple-500" />
            <span className="text-sm text-white/70">Cota já contemplada</span>
          </label>

          {form.contemplado && (
            <div className="grid grid-cols-3 gap-4">
              <Select label="Forma" options={formaContemplacaoOptions.filter(o => o.value !== 'nao')} value={form.forma_contemplacao} onChange={e => set('forma_contemplacao', e.target.value as FormaContemplacao)} />
              <Input label="Data" type="date" value={form.data_contemplacao} onChange={e => set('data_contemplacao', e.target.value)} />
              <Input label="Valor do lance (R$)" type="number" step="0.01" min={0} placeholder="0,00" value={form.valor_lance} onChange={e => set('valor_lance', e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Vínculos */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Vínculos e situação</p>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" options={statusOptions} value={form.status} onChange={e => set('status', e.target.value as EmprestimoStatus)} />
          <Select
            label="Conta vinculada (Bancos)"
            options={[{ value: '', label: '— Nenhuma —' }, ...contas.map(c => ({ value: c.id, label: c.nome }))]}
            value={form.conta_id}
            onChange={e => set('conta_id', e.target.value)}
          />
          <div className="col-span-2">
            <Select
              label="Obra vinculada (opcional)"
              options={[{ value: '', label: '— Não vinculado —' }, ...obras.map(o => ({ value: o.id, label: o.name }))]}
              value={form.obra_id}
              onChange={e => set('obra_id', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5">Cor</label>
          <div className="flex flex-wrap gap-2">
            {CORES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('cor', c)}
                className={`w-7 h-7 rounded-lg transition-transform ${
                  form.cor === c ? 'ring-2 ring-white/70 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5">Observações</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            rows={2}
            placeholder="Condições, garantias, combinados..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
          />
        </div>
      </div>

      {/* Prévia do cronograma */}
      {preview && (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <p className={`${sectionTitle} mb-3`}>Prévia do cronograma</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{preview.n}</p>
              <p className="text-[10px] text-white/40">parcelas</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{fmtCurrency(preview.primeira)}</p>
              <p className="text-[10px] text-white/40">1ª parcela</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-400 tabular-nums">{fmtCurrency(preview.totalJuros)}</p>
              <p className="text-[10px] text-white/40">total de juros</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{fmtCurrency(preview.totalPagar)}</p>
              <p className="text-[10px] text-white/40">total a pagar</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-400 tabular-nums">
                {preview.cetMensal === null ? '—' : `${preview.cetMensal.toFixed(2)}%`}
              </p>
              <p className="text-[10px] text-white/40">
                CET a.m.{preview.cetAnual !== null ? ` · ${preview.cetAnual.toFixed(1)}% a.a.` : ''}
              </p>
            </div>
          </div>
          {isEditing && (
            <p className="text-[11px] text-amber-400/80 mt-3">
              Editar valores não recalcula as parcelas existentes. Use “Regenerar parcelas” na tela do
              contrato (apaga pagamentos já lançados).
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  )
}
