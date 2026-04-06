'use client'

import { useEffect, useRef, useState } from 'react'
import { FinancialRecord } from '@/types/financial'
import { createFinancialRecord, updateFinancialRecord, uploadReceipt } from '@/services/financialService'
import { toast } from 'sonner'

type Props = {
  onClose: () => void
  initialData: FinancialRecord | null
  onSuccess: () => void
}

const CATEGORIAS = ['Obra', 'Material', 'Mão de obra', 'Equipamento', 'Serviço', 'Imposto', 'Outros']
const CONTAS = ['Conta corrente', 'Conta poupança', 'Caixa físico']
const CENTROS = ['Obra A-01', 'Obra B-03', 'Administrativo', 'Geral']
const FORMAS_PAGAMENTO = ['Transferência (TED/PIX)', 'Boleto bancário', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Cheque']
const TIPOS_DOC = ['NF-e', 'NFS-e', 'RPA', 'Recibo', 'Boleto', 'Contrato', 'Sem documento']
const STATUS_OPTS = ['pago', 'pendente', 'atrasado', 'cancelado', 'parcialmente_pago'] as const
const STATUS_LABELS: Record<string, string> = {
  pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado',
  cancelado: 'Cancelado', parcialmente_pago: 'Parcialmente pago',
}
const TAGS_SUGERIDAS = ['Obra principal', 'Urgente', 'Revisão', 'Contrato fixo', 'Medição']

export function FinanceModal({ onClose, initialData, onSuccess }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState(initialData?.category ?? 'Obra')
  const [costCenter, setCostCenter] = useState(initialData?.cost_center ?? '')
  const [account, setAccount] = useState(initialData?.account ?? 'Conta corrente')
  const [grossValue, setGrossValue] = useState(initialData?.value?.toString() ?? '')
  const [discount, setDiscount] = useState(initialData?.discount?.toString() ?? '0')
  const [issueDate, setIssueDate] = useState(initialData?.date ?? '')
  const [dueDate, setDueDate] = useState(initialData?.due_date ?? '')
  const [paymentDate, setPaymentDate] = useState(initialData?.payment_date ?? '')
  const [docType, setDocType] = useState(initialData?.doc_type ?? 'NF-e')
  const [docNumber, setDocNumber] = useState(initialData?.doc_number ?? '')
  const [supplierDoc, setSupplierDoc] = useState(initialData?.supplier_doc ?? '')
  const [supplierName, setSupplierName] = useState(initialData?.supplier_name ?? '')
  const [type, setType] = useState<'entrada' | 'saida'>(initialData?.type ?? 'entrada')
  const [status, setStatus] = useState(initialData?.status ?? 'pago')
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method ?? 'Transferência (TED/PIX)')
  const [isInstallment, setIsInstallment] = useState(initialData?.installment ?? false)
  const [installmentQty, setInstallmentQty] = useState(initialData?.installment_qty?.toString() ?? '2')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? [])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receipt_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const netValue = Math.max(0, parseFloat(grossValue || '0') - parseFloat(discount || '0'))

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
    }
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleOut)
    document.addEventListener('keydown', handleEsc)
    return () => { document.removeEventListener('mousedown', handleOut); document.removeEventListener('keydown', handleEsc) }
  }, [onClose])

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) { toast.error('Formato não suportado. Use PDF, PNG ou JPG.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 10 MB.'); return }
    setReceiptFile(file)
    setUploading(true)
    try {
      const url = await uploadReceipt(file)
      setReceiptUrl(url)
      toast.success('Arquivo anexado')
    } catch {
      toast.error('Erro ao fazer upload do arquivo')
      setReceiptFile(null)
    } finally { setUploading(false) }
  }

  function removeFile() {
    setReceiptFile(null)
    setReceiptUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!description.trim() || !grossValue || !issueDate) {
      toast.error('Preencha: descrição, valor e data de emissão')
      return
    }
    setSaving(true)
    try {
      const payload = {
        description: description.trim(), type, value: netValue, status, date: issueDate,
        category, cost_center: costCenter || undefined, account,
        discount: parseFloat(discount || '0'),
        due_date: dueDate || undefined, payment_date: paymentDate || undefined,
        doc_type: docType, doc_number: docNumber || undefined,
        supplier_doc: supplierDoc || undefined, supplier_name: supplierName || undefined,
        payment_method: paymentMethod,
        installment: isInstallment, installment_qty: isInstallment ? parseInt(installmentQty) : undefined,
        notes: notes || undefined, tags: selectedTags, receipt_url: receiptUrl || undefined,
      }
      if (initialData) {
        await updateFinancialRecord(initialData.id, payload)
        toast.success('Transação atualizada')
      } else {
        await createFinancialRecord(payload)
        toast.success('Transação criada')
      }
      onSuccess()
      onClose()
    } catch { toast.error('Erro ao salvar transação') }
    finally { setSaving(false) }
  }

  const ic = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors'
  const lc = 'block text-xs font-medium text-white/40 mb-1.5'
  const SL = ({ children }: { children: string }) => (
    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-4">{children}</p>
  )
  const Divider = () => <div className="border-t border-white/6" />

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${type === 'entrada' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {type === 'entrada' ? '💰' : '📤'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{initialData ? 'Editar transação' : 'Nova transação'}</h2>
              <p className="text-xs text-white/35 mt-0.5">Preencha os dados financeiros completos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 hover:bg-white/8 rounded-lg p-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2 px-7 pt-5 flex-shrink-0">
          {(['entrada', 'saida'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                type === t
                  ? t === 'entrada' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-white/4 border-white/10 text-white/40 hover:bg-white/8'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${type === t ? (t === 'entrada' ? 'bg-emerald-400' : 'bg-red-400') : 'bg-white/20'}`} />
              {t === 'entrada' ? 'Entrada (Receita)' : 'Saída (Despesa)'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-6">

          {/* Identificação */}
          <div>
            <SL>Identificação</SL>
            <div className="space-y-3">
              <div>
                <label className={lc}>Descrição <span className="text-red-400">*</span></label>
                <input className={ic} placeholder="Ex: Medição #3 — Estrutura metálica" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lc}>Categoria <span className="text-red-400">*</span></label>
                  <select className={ic} value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIAS.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Centro de custo</label>
                  <select className={ic} value={costCenter} onChange={e => setCostCenter(e.target.value)}>
                    <option value="" className="bg-[#111]">— Selecione —</option>
                    {CENTROS.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Conta bancária</label>
                  <select className={ic} value={account} onChange={e => setAccount(e.target.value)}>
                    {CONTAS.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Valores */}
          <div>
            <SL>Valores e datas</SL>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Valor bruto (R$)', req: true, value: grossValue, onChange: setGrossValue, readOnly: false },
                  { label: 'Desconto / Retenção', req: false, value: discount, onChange: setDiscount, readOnly: false },
                  { label: 'Valor líquido', req: false, value: netValue > 0 ? netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '', onChange: () => {}, readOnly: true },
                ].map(f => (
                  <div key={f.label}>
                    <label className={lc}>{f.label} {f.req && <span className="text-red-400">*</span>}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">R$</span>
                      <input className={`${ic} pl-8 ${f.readOnly ? 'text-white/50 cursor-default' : ''}`}
                        type={f.readOnly ? 'text' : 'number'} placeholder="0,00"
                        value={f.value} onChange={e => f.onChange(e.target.value)} readOnly={f.readOnly} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Data de emissão', req: true, value: issueDate, onChange: setIssueDate },
                  { label: 'Data de vencimento', req: false, value: dueDate, onChange: setDueDate },
                  { label: 'Data de pagamento', req: false, value: paymentDate, onChange: setPaymentDate },
                ].map(f => (
                  <div key={f.label}>
                    <label className={lc}>{f.label} {f.req && <span className="text-red-400">*</span>}</label>
                    <input className={ic} type="date" value={f.value} onChange={e => f.onChange(e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Divider />

          {/* Fiscal */}
          <div>
            <SL>Informações fiscais</SL>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lc}>Tipo de documento</label>
                  <select className={ic} value={docType} onChange={e => setDocType(e.target.value)}>
                    {TIPOS_DOC.map(d => <option key={d} value={d} className="bg-[#111]">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Número do documento</label>
                  <input className={ic} placeholder="Ex: 001234" value={docNumber} onChange={e => setDocNumber(e.target.value)} />
                </div>
                <div>
                  <label className={lc}>CNPJ / CPF</label>
                  <input className={ic} placeholder="00.000.000/0001-00" value={supplierDoc} onChange={e => setSupplierDoc(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lc}>Nome do fornecedor / cliente</label>
                <input className={ic} placeholder="Ex: Construtora Beta Ltda." value={supplierName} onChange={e => setSupplierName(e.target.value)} />
              </div>
            </div>
          </div>

          <Divider />

          {/* Status */}
          <div>
            <SL>Status e pagamento</SL>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Status <span className="text-red-400">*</span></label>
                  <select className={ic} value={status} onChange={e => setStatus(e.target.value as typeof STATUS_OPTS[number])}>
                    {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#111]">{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Forma de pagamento</label>
                  <select className={ic} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {FORMAS_PAGAMENTO.map(f => <option key={f} value={f} className="bg-[#111]">{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button type="button" onClick={() => setIsInstallment(p => !p)} className="flex items-center gap-2.5">
                  <div className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${isInstallment ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <span className={`absolute top-[3px] w-3 h-3 bg-white rounded-full transition-transform ${isInstallment ? 'translate-x-[14px]' : 'translate-x-[3px]'}`} />
                  </div>
                  <span className="text-xs text-white/50">Lançamento parcelado</span>
                </button>
                {isInstallment && (
                  <div className="flex items-center gap-2">
                    <input type="number" min="2" max="60"
                      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-white/30"
                      value={installmentQty} onChange={e => setInstallmentQty(e.target.value)} />
                    <span className="text-xs text-white/30">parcelas iguais</span>
                    {netValue > 0 && installmentQty && (
                      <span className="text-xs text-white/50">
                        = R$ {(netValue / parseInt(installmentQty || '1')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / parcela
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Divider />

          {/* Anexos */}
          <div>
            <SL>Observações e anexos</SL>
            <div className="space-y-3">
              <div>
                <label className={lc}>Observações internas</label>
                <textarea className={`${ic} resize-none`} rows={2} placeholder="Notas internas sobre esta transação..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />

              {receiptFile || receiptUrl ? (
                <div className="border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{receiptFile?.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                    <div>
                      <p className="text-xs text-white/70 font-medium">{receiptFile?.name ?? 'Arquivo anexado'}</p>
                      {receiptFile && <p className="text-xs text-white/30 mt-0.5">{(receiptFile.size / 1024).toFixed(0)} KB</p>}
                    </div>
                    {uploading && <span className="text-xs text-amber-400 animate-pulse">Enviando...</span>}
                    {!uploading && receiptUrl && <span className="text-xs text-emerald-400">✓ Salvo</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {receiptUrl && <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded-lg hover:bg-white/8 transition-colors">Ver</a>}
                    <button type="button" onClick={removeFile} className="text-xs text-red-400/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Remover</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-white/12 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-white/25 transition-colors text-left">
                  <span className="text-base">📎</span>
                  <div>
                    <p className="text-xs text-white/60"><span className="text-white/80 font-medium">Clique para anexar</span> ou arraste o arquivo</p>
                    <p className="text-xs text-white/30 mt-0.5">NF, boleto, contrato, comprovante — PDF, PNG, JPG até 10 MB</p>
                  </div>
                </button>
              )}

              <div>
                <label className={lc}>Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {TAGS_SUGERIDAS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-all ${selectedTags.includes(tag) ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/10 text-white/40 hover:bg-white/8 hover:text-white/60'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-5 border-t border-white/8 flex-shrink-0">
          <span className="text-xs text-white/20">* Campos obrigatórios</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl border border-white/10 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving || uploading}
              className="bg-white text-black px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Salvando...' : 'Salvar transação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}