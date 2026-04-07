'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Evento = {
  id: string
  titulo: string
  data_inicio: string
  tipo?: string
  local?: string
  responsavel?: string
}

type Obra = {
  id: string
  nome: string
  progresso: number
  status: string
  cidade?: string
}

type Conta = {
  id: string
  descricao: string
  valor: number
  vencimento: string
  status: string
  fornecedor?: string
}

type Licitacao = {
  id: string
  titulo: string
  numero?: string
  prazo: string
  status: string
  orgao?: string
}

type Documento = {
  id: string
  nome: string
  vencimento: string
  status?: string
  categoria?: string
}

type Compra = {
  id: string
  descricao: string
  valor_estimado: number
  status: string
}

type DashboardData = {
  eventos: Evento[]
  obras: Obra[]
  contas: Conta[]
  licitacoes: Licitacao[]
  documentos: Documento[]
  compras: Compra[]
  contratos_ativos: number
  total_contas_semana: number
  total_compras_pendentes: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function diasRestantes(dataStr: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(dataStr)
  alvo.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
}

function formatarMoeda(valor: number): string {
  if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)}M`
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(0)}k`
  return `R$ ${valor.toLocaleString('pt-BR')}`
}

function formatarDia(dataStr: string): string {
  const d = new Date(dataStr)
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dias[d.getDay()]} ${hora}`
}

function statusLicitacao(prazo: string) {
  const dias = diasRestantes(prazo)
  if (dias <= 1) return { label: 'URGENTE', cls: 'pill-red' }
  if (dias <= 10) return { label: `${dias} dias`, cls: 'pill-amber' }
  if (dias <= 20) return { label: `${dias} dias`, cls: 'pill-blue' }
  return { label: `${dias} dias`, cls: 'pill-green' }
}

function statusDocumento(vencimento: string) {
  const dias = diasRestantes(vencimento)
  if (dias <= 5) return { label: 'CRÍTICO', cls: 'pill-red' }
  if (dias <= 15) return { label: 'ATENÇÃO', cls: 'pill-amber' }
  return { label: `${dias} dias`, cls: 'pill-blue' }
}

function corObra(index: number): string {
  const cores = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#f97316']
  return cores[index % cores.length]
}

function corAgenda(tipo?: string): string {
  const map: Record<string, string> = {
    reuniao: '#3b82f6',
    licitacao: '#f59e0b',
    vistoria: '#22c55e',
    financeiro: '#a855f7',
    entrega: '#ef4444',
  }
  return map[tipo ?? ''] ?? '#666'
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchDashboard(): Promise<DashboardData> {
  const hoje = new Date()
  const fimSemana = addDays(hoje, 7)
  const em30dias = addDays(hoje, 30)

  const hojeISO = hoje.toISOString()
  const fimSemanaISO = fimSemana.toISOString()
  const em30diasISO = em30dias.toISOString()

  const [
    { data: eventos },
    { data: obras },
    { data: contas },
    { data: licitacoes },
    { data: documentos },
    { data: compras },
    { count: contratos_ativos },
  ] = await Promise.all([
    // Eventos da semana
    supabase
      .from('agenda')
      .select('id, titulo, data_inicio, tipo, local, responsavel')
      .gte('data_inicio', hojeISO)
      .lte('data_inicio', fimSemanaISO)
      .order('data_inicio', { ascending: true })
      .limit(5),

    // Obras ativas com progresso
    supabase
      .from('obras')
      .select('id, nome, progresso, status, cidade')
      .eq('status', 'andamento')
      .order('progresso', { ascending: false })
      .limit(6),

    // Contas a pagar na semana
    supabase
      .from('financeiro')
      .select('id, descricao, valor, vencimento, status, fornecedor')
      .in('status', ['pendente', 'em_aberto', 'aberto'])
      .gte('vencimento', hojeISO)
      .lte('vencimento', fimSemanaISO)
      .order('vencimento', { ascending: true })
      .limit(5),

    // Licitações abertas com prazo próximo
    supabase
      .from('licitacao')
      .select('id, titulo, numero, prazo, status, orgao')
      .in('status', ['aberta', 'em_andamento', 'ativo', 'pendente'])
      .gte('prazo', hojeISO)
      .order('prazo', { ascending: true })
      .limit(5),

    // Documentos vencendo em 30 dias
    supabase
      .from('acervotecnico')
      .select('id, nome, vencimento, status, categoria')
      .gte('vencimento', hojeISO)
      .lte('vencimento', em30diasISO)
      .order('vencimento', { ascending: true })
      .limit(4),

    // Solicitações de compra pendentes
    supabase
      .from('compras')
      .select('id, descricao, valor_estimado, status')
      .in('status', ['pendente', 'aberto', 'solicitado'])
      .limit(5),

    // Contratos ativos (só contagem)
    supabase
      .from('contratos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ativo'),
  ])

  const contasLista = contas ?? []
  const comprasLista = compras ?? []

  const total_contas_semana = contasLista.reduce((acc, c) => acc + (c.valor ?? 0), 0)
  const total_compras_pendentes = comprasLista.reduce((acc, c) => acc + (c.valor_estimado ?? 0), 0)

  return {
    eventos: eventos ?? [],
    obras: obras ?? [],
    contas: contasLista,
    licitacoes: licitacoes ?? [],
    documentos: documentos ?? [],
    compras: comprasLista,
    contratos_ativos: contratos_ativos ?? 0,
    total_contas_semana,
    total_compras_pendentes,
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function KPI({
  label,
  value,
  sub,
  subColor,
  accentColor,
}: {
  label: string
  value: string
  sub: string
  subColor: 'green' | 'red' | 'amber' | 'muted'
  accentColor: string
}) {
  const subCls = {
    green: 'text-green-400',
    red: 'text-red-400',
    amber: 'text-yellow-400',
    muted: 'text-gray-600',
  }[subColor]

  return (
    <div className="relative bg-[#111] border border-[#1f1f1f] rounded-2xl px-5 py-4 overflow-hidden hover:border-[#2a2a2a] transition-colors">
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: accentColor }}
      />
      <p className="text-[11px] font-medium tracking-widest uppercase text-[#555] mb-2">{label}</p>
      <p className="text-[28px] font-medium text-white leading-none mb-1 font-mono">{value}</p>
      <p className={`text-[12px] ${subCls}`}>{sub}</p>
    </div>
  )
}

function Panel({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] font-medium text-[#999] tracking-[0.04em]">{title}</span>
        {href && (
          <Link
            href={href}
            className="text-[11px] text-[#444] border border-[#222] rounded-md px-2.5 py-1 font-mono hover:text-[#aaa] hover:border-[#444] transition-colors"
          >
            ver tudo →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function Pill({ label, type }: { label: string; type: 'red' | 'amber' | 'green' | 'blue' | 'gray' }) {
  const cls = {
    red: 'bg-[#1f0f0f] text-red-400 border border-[#3f1f1f]',
    amber: 'bg-[#1f1800] text-yellow-400 border border-[#3f2f00]',
    green: 'bg-[#0a1f0f] text-green-400 border border-[#1a3f1f]',
    blue: 'bg-[#0f1820] text-blue-400 border border-[#1f3550]',
    gray: 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]',
  }[type]

  return (
    <span className={`text-[10px] font-medium font-mono tracking-[0.04em] px-2.5 py-[3px] rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

function Row({
  label,
  sub,
  right,
}: {
  label: string
  sub?: string
  right: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#1a1a1a] last:border-0 last:pb-0 gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-[#ccc] truncate">{label}</p>
        {sub && <p className="text-[11px] text-[#555] mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  )
}

function Divider() {
  return <div className="h-[0.5px] bg-[#1a1a1a] my-3" />
}

function AlertStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex items-center gap-3 bg-[#150e00] border border-[#3f2500] rounded-xl px-4 py-3 mb-6">
      <span className="text-[14px]">⚠</span>
      <span className="text-[12px] text-yellow-400">{items.join(' · ')}</span>
    </div>
  )
}

function BaraProgresso({ obra, index }: { obra: Obra; index: number }) {
  const pct = Math.min(100, Math.max(0, obra.progresso ?? 0))
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-[#aaa] truncate pr-2">{obra.nome}</span>
        <span className="text-[12px] text-[#666] font-mono flex-shrink-0">{pct}%</span>
      </div>
      <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: corObra(index) }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const hoje = new Date()
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const dataFormatada = `${diasSemana[hoje.getDay()]}, ${hoje.getDate()} ${meses[hoje.getMonth()]} ${hoje.getFullYear()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border border-white/10 border-t-white/50 rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#555]">Carregando painel executivo…</p>
        </div>
      </div>
    )
  }

  if (erro || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#111] border border-red-900/40 rounded-2xl p-8 text-center max-w-sm">
          <p className="text-red-400 text-[13px] mb-2">Erro ao carregar dashboard</p>
          <p className="text-[#555] text-[12px] font-mono">{erro}</p>
        </div>
      </div>
    )
  }

  // Alertas automáticos
  const alertas: string[] = []
  const docsUrgentes = data.documentos.filter((d) => diasRestantes(d.vencimento) <= 7)
  const licitUrgente = data.licitacoes.filter((l) => diasRestantes(l.prazo) <= 2)
  if (docsUrgentes.length > 0) alertas.push(`${docsUrgentes.length} doc${docsUrgentes.length > 1 ? 's' : ''} venc${docsUrgentes.length > 1 ? 'em' : 'e'} em 7 dias`)
  if (data.contas.length > 0) alertas.push(`${data.contas.length} conta${data.contas.length > 1 ? 's' : ''} a pagar esta semana`)
  if (licitUrgente.length > 0) alertas.push(`${licitUrgente.length} licitação com prazo amanhã`)

  // Progresso médio das obras
  const progressoMedio =
    data.obras.length > 0
      ? Math.round(data.obras.reduce((acc, o) => acc + (o.progresso ?? 0), 0) / data.obras.length)
      : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[22px] font-medium text-white">Painel Executivo</h1>
          <p className="text-[13px] text-[#555] mt-1 font-mono">{dataFormatada}</p>
        </div>
        <div className="flex items-center gap-2 bg-[#111] border border-[#1f1f1f] rounded-xl px-3.5 py-2 text-[12px] text-[#555] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
          Supabase conectado
        </div>
      </div>

      {/* Alertas */}
      <AlertStrip items={alertas} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          label="Obras Ativas"
          value={String(data.obras.length)}
          sub={`Progresso médio: ${progressoMedio}%`}
          subColor="green"
          accentColor="#3b82f6"
        />
        <KPI
          label="Contratos Ativos"
          value={String(data.contratos_ativos)}
          sub="em carteira"
          subColor="muted"
          accentColor="#22c55e"
        />
        <KPI
          label="A Pagar esta Semana"
          value={formatarMoeda(data.total_contas_semana)}
          sub={`${data.contas.length} contas pendentes`}
          subColor={data.contas.length > 0 ? 'amber' : 'muted'}
          accentColor="#f59e0b"
        />
        <KPI
          label="Docs Vencendo"
          value={String(data.documentos.length)}
          sub={docsUrgentes.length > 0 ? `${docsUrgentes.length} urgentes` : 'nos próximos 30 dias'}
          subColor={docsUrgentes.length > 0 ? 'red' : 'muted'}
          accentColor="#ef4444"
        />
      </div>

      {/* Linha principal: agenda + obras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Panel title="📅 Agenda da Semana" href="/agenda">
          {data.eventos.length === 0 ? (
            <p className="text-[13px] text-[#555] py-4 text-center">Nenhum compromisso esta semana</p>
          ) : (
            data.eventos.map((ev) => (
              <div key={ev.id} className="flex gap-3.5 py-2.5 border-b border-[#1a1a1a] last:border-0 items-start">
                <span className="text-[11px] text-[#555] font-mono min-w-[52px] pt-0.5 leading-tight">
                  {formatarDia(ev.data_inicio)}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: corAgenda(ev.tipo) }}
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-[#ccc] truncate">{ev.titulo}</p>
                  {(ev.local || ev.responsavel) && (
                    <p className="text-[11px] text-[#555] mt-0.5">
                      {[ev.local, ev.responsavel].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </Panel>

        <Panel title="🏗️ Obras em Andamento" href="/obras">
          {data.obras.length === 0 ? (
            <p className="text-[13px] text-[#555] py-4 text-center">Nenhuma obra ativa</p>
          ) : (
            <>
              {data.obras.map((obra, i) => (
                <BaraProgresso key={obra.id} obra={obra} index={i} />
              ))}
              <Divider />
              <div className="flex justify-between">
                <span className="text-[12px] text-[#666]">Progresso médio geral</span>
                <span className="text-[14px] font-medium text-white font-mono">{progressoMedio}%</span>
              </div>
            </>
          )}
        </Panel>

      </div>

      {/* Linha inferior: contas + licitações + docs/compras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Panel title="💰 Contas a Pagar" href="/financeiro">
          {data.contas.length === 0 ? (
            <p className="text-[13px] text-[#555] py-4 text-center">Nenhuma conta esta semana</p>
          ) : (
            <>
              {data.contas.map((c) => {
                const dias = diasRestantes(c.vencimento)
                const tipo = dias <= 1 ? 'red' : dias <= 4 ? 'amber' : 'gray'
                const sub = dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : `Vence em ${dias} dias`
                return (
                  <Row
                    key={c.id}
                    label={c.descricao || c.fornecedor || 'Conta'}
                    sub={sub}
                    right={<Pill label={formatarMoeda(c.valor)} type={tipo} />}
                  />
                )
              })}
              <Divider />
              <div className="flex justify-between">
                <span className="text-[12px] text-[#666]">Total na semana</span>
                <span className="text-[14px] font-medium text-white font-mono">
                  {formatarMoeda(data.total_contas_semana)}
                </span>
              </div>
            </>
          )}
        </Panel>

        <Panel title="📋 Licitações Ativas" href="/licitacao">
          {data.licitacoes.length === 0 ? (
            <p className="text-[13px] text-[#555] py-4 text-center">Nenhuma licitação ativa</p>
          ) : (
            data.licitacoes.map((l) => {
              const s = statusLicitacao(l.prazo)
              return (
                <Row
                  key={l.id}
                  label={l.titulo}
                  sub={l.orgao ?? (l.numero ? `#${l.numero}` : undefined)}
                  right={<Pill label={s.label} type={s.cls.replace('pill-', '') as any} />}
                />
              )
            })
          )}
        </Panel>

        <Panel title="📁 Documentos & Compras" href="/acervotecnico">
          {data.documentos.map((d) => {
            const s = statusDocumento(d.vencimento)
            return (
              <Row
                key={d.id}
                label={d.nome}
                sub={`Vence em ${diasRestantes(d.vencimento)} dias`}
                right={<Pill label={s.label} type={s.cls.replace('pill-', '') as any} />}
              />
            )
          })}

          {data.documentos.length > 0 && data.compras.length > 0 && <Divider />}

          {data.compras.length > 0 && (
            <Row
              label="🛒 Solicitações de Compra"
              sub={`${data.compras.length} pendente${data.compras.length > 1 ? 's' : ''}`}
              right={<Pill label={formatarMoeda(data.total_compras_pendentes)} type="amber" />}
            />
          )}

          {data.documentos.length === 0 && data.compras.length === 0 && (
            <p className="text-[13px] text-[#555] py-4 text-center">Tudo em dia</p>
          )}
        </Panel>

      </div>
    </div>
  )
}
