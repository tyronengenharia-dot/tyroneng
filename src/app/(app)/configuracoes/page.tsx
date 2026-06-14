'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, Building2 } from 'lucide-react'
import { getEmpresaConfig, upsertEmpresaConfig } from '@/services/empresaService'
import { Btn, Input, LoadingSpinner } from '@/components/ui'

// Reduz a imagem escolhida para ~256px e devolve um data URL PNG (transparência
// preservada). Mantém o PDF leve — guardamos o base64 em empresa_config.logo_url.
function fileToLogoDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('img'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('file'))
    reader.readAsDataURL(file)
  })
}

const card = 'bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    razao_social: '', cnpj: '', rt_nome: '', rt_titulo: 'Engenheiro Civil', rt_crea: '',
  })
  const [logo, setLogo] = useState<string>('')
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    let active = true
    getEmpresaConfig().then(cfg => {
      if (!active) return
      if (cfg) {
        setForm({
          razao_social: cfg.razao_social ?? '',
          cnpj:         cfg.cnpj ?? '',
          rt_nome:      cfg.rt_nome ?? '',
          rt_titulo:    cfg.rt_titulo ?? 'Engenheiro Civil',
          rt_crea:      cfg.rt_crea ?? '',
        })
        setLogo(cfg.logo_url ?? '')
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function handlePickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem.'); return }
    try {
      const dataUrl = await fileToLogoDataUrl(file)
      setLogo(dataUrl)
      toast.success('Logo carregado. Clique em Salvar para confirmar.')
    } catch {
      toast.error('Não foi possível processar a imagem.')
    }
  }

  async function handleSave() {
    setSaving(true)
    const res = await upsertEmpresaConfig({
      razao_social: form.razao_social || null,
      cnpj: form.cnpj || null,
      rt_nome: form.rt_nome || null,
      rt_titulo: form.rt_titulo || null,
      rt_crea: form.rt_crea || null,
      logo_url: logo || null,
    })
    setSaving(false)
    if (res) toast.success('Configurações salvas.')
    else toast.error('Erro ao salvar. A migração 0014 já foi aplicada?')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações da empresa</h1>
        <p className="text-gray-400 text-sm">
          Identidade, responsável técnico e logo — usados nos PDFs (cronograma, capa e assinatura). Salvo na nuvem, vale para todas as obras.
        </p>
      </div>

      {/* Identidade */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">Identidade</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Razão social" placeholder="Ex: Tyron Engenharia Ltda."
            value={form.razao_social} onChange={e => set('razao_social', e.target.value)} />
          <Input label="CNPJ" placeholder="00.000.000/0001-00"
            value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
        </div>
      </div>

      {/* Logo */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-white/80 mb-1">Logo</h2>
        <p className="text-[12px] text-white/35 mb-4">
          Aparece na capa e no cabeçalho dos PDFs. Imagem reduzida automaticamente; PNG com fundo transparente fica melhor.
        </p>
        <div className="flex items-center gap-5">
          <div className="w-28 h-28 rounded-xl bg-white border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logo} alt="Logo" className="max-w-[88%] max-h-[88%] object-contain" />
              : <span className="text-[11px] text-black/30">Sem logo</span>}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePickLogo} className="hidden" />
            <Btn variant="primary" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Escolher imagem
            </Btn>
            {logo && (
              <button onClick={() => setLogo('')}
                className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsável técnico */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-white/80 mb-1">Responsável técnico</h2>
        <p className="text-[12px] text-white/35 mb-4">Usado no bloco de assinatura dos cronogramas.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome" placeholder="Ex: Eng. Fulano de Tal"
            value={form.rt_nome} onChange={e => set('rt_nome', e.target.value)} />
          <Input label="Título" placeholder="Engenheiro Civil"
            value={form.rt_titulo} onChange={e => set('rt_titulo', e.target.value)} />
        </div>
        <div className="mt-3">
          <Input label="CREA / CAU" placeholder="Ex: SP-123456789"
            value={form.rt_crea} onChange={e => set('rt_crea', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </Btn>
      </div>
    </div>
  )
}
