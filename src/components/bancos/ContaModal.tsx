'use client'

import { useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { BancoConta, ContaTipo } from '@/types/banco'
import { createConta, updateConta } from '@/services/bancoService'
import { contaTipoOptions, CORES } from '@/lib/bancoConstants'

interface Props {
  conta: BancoConta | null
  onClose: () => void
  onSaved: () => void
}

export function ContaModal({ conta, onClose, onSaved }: Props) {
  const isEditing = !!conta
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: conta?.nome ?? '',
    tipo: (conta?.tipo ?? 'corrente') as ContaTipo,
    banco: conta?.banco ?? '',
    agencia: conta?.agencia ?? '',
    numero_conta: conta?.numero_conta ?? '',
    titular: conta?.titular ?? '',
    saldo_inicial: conta?.saldo_inicial?.toString() ?? '0',
    cor: conta?.cor ?? CORES[0],
    ativo: conta?.ativo ?? true,
    observacoes: conta?.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const valido = form.nome.trim() !== '' && form.saldo_inicial !== ''

  async function handleSubmit() {
    if (!valido) {
      setError('Informe ao menos o nome da conta e o saldo inicial.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      banco: form.banco.trim() || null,
      agencia: form.agencia.trim() || null,
      numero_conta: form.numero_conta.trim() || null,
      titular: form.titular.trim() || null,
      saldo_inicial: Number(form.saldo_inicial) || 0,
      cor: form.cor,
      ativo: form.ativo,
      observacoes: form.observacoes.trim() || null,
    }

    const { error } = isEditing
      ? await updateConta(conta!.id, payload)
      : await createConta(payload)

    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar conta' : 'Nova central de conta'}
      subtitle={
        isEditing
          ? conta!.nome
          : 'Cadastre uma conta bancária, caixa ou aplicação da empresa'
      }
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={saving || !valido}
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar conta'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Nome da conta"
            required
            placeholder="Ex.: Banco do Brasil — CC Principal"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
          />
        </div>

        <Select
          label="Tipo"
          options={contaTipoOptions}
          value={form.tipo}
          onChange={e => set('tipo', e.target.value as ContaTipo)}
        />
        <Input
          label="Saldo inicial (R$)"
          required
          type="number"
          step="0.01"
          placeholder="0,00"
          value={form.saldo_inicial}
          onChange={e => set('saldo_inicial', e.target.value)}
        />

        <Input
          label="Banco"
          placeholder="Ex.: Banco do Brasil"
          value={form.banco}
          onChange={e => set('banco', e.target.value)}
        />
        <Input
          label="Titular"
          placeholder="Nome / razão social"
          value={form.titular}
          onChange={e => set('titular', e.target.value)}
        />

        <Input
          label="Agência"
          placeholder="0000"
          value={form.agencia}
          onChange={e => set('agencia', e.target.value)}
        />
        <Input
          label="Número da conta"
          placeholder="00000-0"
          value={form.numero_conta}
          onChange={e => set('numero_conta', e.target.value)}
        />

        {/* Cor de identificação */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-white/40 mb-1.5">
            Cor de identificação
          </label>
          <div className="flex flex-wrap gap-2">
            {CORES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('cor', c)}
                className={`w-7 h-7 rounded-lg transition-transform ${
                  form.cor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <Select
          label="Situação"
          options={[
            { value: 'true', label: 'Ativa' },
            { value: 'false', label: 'Inativa' },
          ]}
          value={form.ativo ? 'true' : 'false'}
          onChange={e => set('ativo', e.target.value === 'true')}
        />

        <div className="col-span-2">
          <label className="block text-xs font-medium text-white/40 mb-1.5">
            Observações
          </label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            rows={2}
            placeholder="Informações adicionais sobre a conta..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </Modal>
  )
}
