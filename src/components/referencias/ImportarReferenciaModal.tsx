'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { ReferenciaFonte } from '@/types/referencia'
import { importarVersao } from '@/services/referenciaService'
import { parseReferencia, ResultadoParse } from '@/lib/parseReferencia'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ImportarReferenciaModal({ onClose, onSaved }: Props) {
  const hoje = new Date()
  const [fonte, setFonte] = useState<ReferenciaFonte>('emop')
  const [ano, setAno] = useState(String(hoje.getFullYear()))
  const [mes, setMes] = useState(String(hoje.getMonth() + 1))
  const [uf, setUf] = useState('')
  const [rotulo, setRotulo] = useState('')
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState<ResultadoParse | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTexto(String(reader.result ?? ''))
      setPreview(null)
    }
    reader.readAsText(file)
  }

  function processar() {
    setError(null)
    setPreview(parseReferencia(texto))
  }

  async function importar() {
    const res = preview ?? parseReferencia(texto)
    if (res.linhas.length === 0) {
      setError('Nenhuma linha válida encontrada. Confira o formato (Código · Descrição · Unidade · Valor).')
      setPreview(res)
      return
    }
    const anoN = Number(ano)
    const mesN = Number(mes)
    if (!anoN || anoN < 2000 || anoN > 2100) {
      setError('Ano inválido.')
      return
    }
    if (!mesN || mesN < 1 || mesN > 12) {
      setError('Mês inválido.')
      return
    }

    setImporting(true)
    setError(null)
    const { error } = await importarVersao(
      { fonte, ano: anoN, mes: mesN, uf, rotulo },
      res.linhas
    )
    setImporting(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title="Importar tabela de referência"
      subtitle="EMOP ou SINAPI — uma versão por mês/ano"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={importar} disabled={importing}>
            {importing ? 'Importando...' : 'Importar'}
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        {/* Metadados da versão */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Fonte"
            options={[
              { value: 'emop', label: 'EMOP' },
              { value: 'sinapi', label: 'SINAPI' },
            ]}
            value={fonte}
            onChange={e => setFonte(e.target.value as ReferenciaFonte)}
          />
          <Select
            label="Mês"
            options={meses.map((m, i) => ({ value: String(i + 1), label: m }))}
            value={mes}
            onChange={e => setMes(e.target.value)}
          />
          <Input label="Ano" type="number" min={2000} max={2100} value={ano} onChange={e => setAno(e.target.value)} />
          <Input label="UF (opcional)" placeholder="Ex.: RJ" value={uf} onChange={e => setUf(e.target.value)} />
          <div className="col-span-2">
            <Input
              label="Rótulo (opcional)"
              placeholder="Ex.: desonerado, não desonerado"
              value={rotulo}
              onChange={e => setRotulo(e.target.value)}
            />
          </div>
        </div>

        {/* Dados */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/40">
              Dados (cole do Excel ou um CSV) <span className="text-red-400">*</span>
            </label>
            <label className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
              <Upload size={13} /> Enviar arquivo
              <input type="file" accept=".csv,.txt,.tsv" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <textarea
            value={texto}
            onChange={e => {
              setTexto(e.target.value)
              setPreview(null)
            }}
            rows={6}
            placeholder={'Código  Descrição  Unidade  Valor\n74209/1  Alvenaria...  m²  89,57'}
            className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors font-mono resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-white/30">
              Ordem das colunas: <span className="text-white/50">Código · Descrição · Unidade · Valor</span>
            </p>
            <Btn variant="ghost" size="sm" onClick={processar} disabled={!texto.trim()}>
              Pré-visualizar
            </Btn>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.02] text-xs border-b border-white/8">
              <span className="text-green-400 font-medium">{preview.linhas.length} válidas</span>
              <span className="text-white/40">{preview.ignoradas} ignoradas</span>
              <span className="text-white/30">de {preview.total} linhas</span>
            </div>
            {preview.linhas.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 border-b border-white/8">
                    <th className="text-left px-3 py-2 font-semibold">Código</th>
                    <th className="text-left px-3 py-2 font-semibold">Descrição</th>
                    <th className="text-left px-3 py-2 font-semibold">Un</th>
                    <th className="text-right px-3 py-2 font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.linhas.slice(0, 6).map((l, idx) => (
                    <tr key={idx} className="border-t border-white/[0.05]">
                      <td className="px-3 py-1.5 font-mono text-white/60">{l.codigo}</td>
                      <td className="px-3 py-1.5 text-white/80 truncate max-w-xs">{l.descricao}</td>
                      <td className="px-3 py-1.5 text-white/40">{l.unidade}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-white/80">
                        {formatCurrency(l.valor_unitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {preview.linhas.length > 6 && (
              <p className="text-xs text-white/30 px-3 py-2 border-t border-white/[0.05]">
                + {preview.linhas.length - 6} linhas...
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  )
}
