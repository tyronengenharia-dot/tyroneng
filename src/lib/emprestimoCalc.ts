// ─── Motor de cálculo de empréstimos & consórcios ────────────────────────────
// Puro (sem efeitos colaterais, sem eval). Gera o cronograma de parcelas por
// regime e recompõe o "ledger" (saldo devedor) a partir dos pagamentos reais.
//
// Caso central — "empréstimo do tio" (regime 'juros_saldo', capitaliza=true):
//   juros do mês = saldo_devedor × taxa
//   saldo_final  = saldo_inicial + juros − valor_pago
//   → se você paga só o juros, o saldo fica igual (interest-only).
//   → se não paga, o juros entra no saldo e o mês seguinte rende sobre o novo saldo.

import {
  Emprestimo,
  EmprestimoParcela,
  ParcelaCalculada,
  ParcelaStatus,
} from '@/types/emprestimo'

// Subconjunto do contrato necessário ao cálculo (aceita o form antes de persistir).
export type ContratoCalc = Pick<
  Emprestimo,
  | 'categoria'
  | 'regime'
  | 'valor_principal'
  | 'taxa_juros_mensal'
  | 'capitaliza'
  | 'carencia_meses'
  | 'num_parcelas'
  | 'data_inicio'
  | 'data_limite'
  | 'dia_vencimento'
  | 'taxa_admin_pct'
  | 'fundo_reserva_pct'
>

// ─── helpers numéricos / de data ─────────────────────────────────────────────

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ultimoDiaDoMes(y: number, m1: number): number {
  // m1 = mês 1-based; day 0 do mês seguinte = último dia do mês m1
  return new Date(y, m1, 0).getDate()
}

// Soma `n` meses a uma data ISO, opcionalmente fixando o dia de vencimento
// (com clamp para meses curtos: dia 31 em fevereiro → último dia de fevereiro).
export function addMeses(iso: string, n: number, dia?: number): string {
  const { y, m, d } = parseISO(iso)
  const total0 = m - 1 + n
  const ny = y + Math.floor(total0 / 12)
  const nm = ((total0 % 12) + 12) % 12 + 1
  const desejado = dia ?? d
  const nd = Math.min(desejado, ultimoDiaDoMes(ny, nm))
  return `${ny}-${pad(nm)}-${pad(nd)}`
}

// Nº de meses cheios entre duas datas ISO.
export function mesesEntre(inicio: string, fim: string): number {
  const a = parseISO(inicio)
  const b = parseISO(fim)
  let n = (b.y - a.y) * 12 + (b.m - a.m)
  if (b.d < a.d) n -= 1
  return Math.max(0, n)
}

export function hojeISO(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function diasEntre(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`)
  const b = new Date(`${bISO}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

// Conversões de taxa efetiva (compostas).
export function anualParaMensal(anualPct: number): number {
  return (Math.pow(1 + anualPct / 100, 1 / 12) - 1) * 100
}

export function mensalParaAnual(mensalPct: number): number {
  return (Math.pow(1 + mensalPct / 100, 12) - 1) * 100
}

// Quantidade de parcelas: usa num_parcelas; senão deriva de data_inicio→data_limite.
export function numeroDeParcelas(c: ContratoCalc): number {
  let n = c.num_parcelas ?? 0
  if (!n && c.data_limite) n = mesesEntre(c.data_inicio, c.data_limite)
  if (!n) n = 1
  return Math.max(1, Math.round(n))
}

// ─── Geração do cronograma (projeção ideal, assumindo pagamento em dia) ───────

export function gerarParcelas(c: ContratoCalc): ParcelaCalculada[] {
  const taxa = (c.taxa_juros_mensal || 0) / 100
  const dia = c.dia_vencimento ?? parseISO(c.data_inicio).d
  const n = numeroDeParcelas(c)
  const parcelas: ParcelaCalculada[] = []

  const push = (
    numero: number,
    saldoIni: number,
    juros: number,
    amort: number,
    total: number,
    saldoFim: number
  ) => {
    const venc = addMeses(c.data_inicio, numero, dia)
    parcelas.push({
      numero,
      competencia: venc.slice(0, 7),
      vencimento: venc,
      saldo_inicial: round2(saldoIni),
      valor_juros: round2(juros),
      valor_amortizacao: round2(amort),
      valor_total: round2(total),
      saldo_final: round2(Math.max(0, saldoFim)),
    })
  }

  // ── Consórcio ou empréstimo sem juros: parcela = base / n ──
  if (c.categoria === 'consorcio' || c.regime === 'sem_juros') {
    const admin = c.categoria === 'consorcio' ? (c.taxa_admin_pct || 0) / 100 : 0
    const fundo = c.categoria === 'consorcio' ? (c.fundo_reserva_pct || 0) / 100 : 0
    const base = round2(c.valor_principal * (1 + admin + fundo))
    const parcela = round2(base / n)
    let saldo = base
    for (let i = 1; i <= n; i++) {
      const valor = i === n ? round2(saldo) : parcela // última quita o resíduo
      const saldoFim = saldo - valor
      push(i, saldo, 0, valor, valor, saldoFim)
      saldo = round2(saldoFim)
    }
    return parcelas
  }

  const carencia = Math.max(0, c.carencia_meses ?? 0)

  // ── Tabela Price (parcela fixa) ──
  if (c.regime === 'price') {
    let saldo = c.valor_principal
    // carência: paga só os juros, sem amortizar
    for (let k = 1; k <= carencia; k++) {
      const juros = round2(saldo * taxa)
      push(k, saldo, juros, 0, juros, saldo)
    }
    const pmt =
      taxa > 0
        ? round2((saldo * taxa) / (1 - Math.pow(1 + taxa, -n)))
        : round2(saldo / n)
    for (let j = 1; j <= n; j++) {
      const juros = round2(saldo * taxa)
      const ultima = j === n
      const amort = ultima ? round2(saldo) : round2(pmt - juros)
      const total = ultima ? round2(saldo + juros) : pmt
      const saldoFim = saldo - amort
      push(carencia + j, saldo, juros, amort, total, saldoFim)
      saldo = round2(saldoFim)
    }
    return parcelas
  }

  // ── SAC (amortização constante) ──
  if (c.regime === 'sac') {
    let saldo = c.valor_principal
    for (let k = 1; k <= carencia; k++) {
      const juros = round2(saldo * taxa)
      push(k, saldo, juros, 0, juros, saldo)
    }
    const amortConst = round2(c.valor_principal / n)
    for (let j = 1; j <= n; j++) {
      const juros = round2(saldo * taxa)
      const ultima = j === n
      const amort = ultima ? round2(saldo) : amortConst
      const total = round2(amort + juros)
      const saldoFim = saldo - amort
      push(carencia + j, saldo, juros, amort, total, saldoFim)
      saldo = round2(saldoFim)
    }
    return parcelas
  }

  // ── juros_saldo (o caso do tio): interest-only com balão final ──
  const principal = c.valor_principal
  let saldo = principal
  for (let k = 1; k <= n; k++) {
    const ultima = k === n
    const base = c.capitaliza ? saldo : principal
    const juros = round2(base * taxa)
    const amort = ultima ? round2(saldo) : 0
    const total = ultima ? round2(saldo + juros) : juros // paga só o juros, exceto no fim
    const saldoFim = ultima ? 0 : round2(saldo + juros - total) // = saldo (interest-only)
    push(k, saldo, juros, amort, total, saldoFim)
    saldo = round2(saldoFim)
  }
  return parcelas
}

// ─── Recálculo do ledger a partir dos pagamentos reais ───────────────────────
// Mantém os campos de pagamento das parcelas existentes e recompõe a parte
// financeira (saldo_inicial / juros / saldo_final) seguindo o saldo real.
// É o que faz a capitalização do "caso do tio" funcionar quando uma parcela
// é paga parcialmente ou não é paga.

export function recalcularParcelas(
  contrato: ContratoCalc,
  parcelasExistentes: EmprestimoParcela[]
): EmprestimoParcela[] {
  const taxa = (contrato.taxa_juros_mensal || 0) / 100
  const ordered = [...parcelasExistentes].sort((a, b) => a.numero - b.numero)
  const n = ordered.length
  const principal = contrato.valor_principal

  // juros_saldo: o saldo evolui em função do que foi efetivamente pago.
  if (contrato.regime === 'juros_saldo' && contrato.categoria === 'emprestimo') {
    let saldo = principal
    return ordered.map((p, idx) => {
      const ultima = idx === n - 1
      const base = contrato.capitaliza ? saldo : principal
      const juros = round2(base * taxa)
      const amort = ultima ? round2(saldo) : 0
      const totalDevido = ultima ? round2(saldo + juros) : juros
      const pago = p.valor_pago || 0
      const saldoFim = round2(Math.max(0, saldo + juros - pago))
      const out: EmprestimoParcela = {
        ...p,
        saldo_inicial: round2(saldo),
        valor_juros: juros,
        valor_amortizacao: amort,
        valor_total: totalDevido,
        saldo_final: saldoFim,
      }
      saldo = saldoFim
      return out
    })
  }

  // price / sac / sem_juros: cronograma fixo; só refletimos o saldo real (atrasos/adiantamentos).
  const schedule = gerarParcelas(contrato)
  let saldo = principal
  return ordered.map((p, idx) => {
    const s = schedule[idx]
    const juros = s ? s.valor_juros : 0
    const amort = s ? s.valor_amortizacao : p.valor_amortizacao
    const total = s ? s.valor_total : p.valor_total
    const pago = p.valor_pago || 0
    const saldoFim = round2(Math.max(0, saldo + juros - pago))
    const out: EmprestimoParcela = {
      ...p,
      saldo_inicial: round2(saldo),
      valor_juros: juros,
      valor_amortizacao: amort,
      valor_total: total,
      saldo_final: saldoFim,
    }
    saldo = saldoFim
    return out
  })
}

// ─── Status derivado da parcela (nunca persistido) ───────────────────────────

export function statusParcela(
  p: { valor_pago: number; valor_total: number; vencimento: string },
  hoje: string = hojeISO()
): ParcelaStatus {
  const pago = p.valor_pago || 0
  if (p.valor_total > 0 && pago >= p.valor_total - 0.005) return 'paga'
  if (pago > 0) return p.vencimento < hoje ? 'atrasada' : 'parcial'
  return p.vencimento < hoje ? 'atrasada' : 'prevista'
}

// ─── Saldo devedor atual (mesma fórmula da view emprestimos_resumo) ──────────

export function saldoDevedorAtual(
  contrato: Pick<Emprestimo, 'valor_principal'>,
  parcelas: EmprestimoParcela[],
  hoje: string = hojeISO()
): number {
  const jurosIncorridos = parcelas
    .filter(p => p.vencimento <= hoje)
    .reduce((a, p) => a + (p.valor_juros || 0), 0)
  const pago = parcelas.reduce((a, p) => a + (p.valor_pago || 0), 0)
  return round2(contrato.valor_principal + jurosIncorridos - pago)
}

// ─── Encargos de atraso (multa + mora pró-rata dia) ──────────────────────────

export type Encargos = { dias: number; multa: number; mora: number; total: number }

export function encargosAtraso(
  parcela: { valor_total: number; valor_pago: number; vencimento: string },
  contrato: { multa_atraso_pct: number; juros_mora_mensal: number },
  hoje: string = hojeISO()
): Encargos {
  const devido = (parcela.valor_total || 0) - (parcela.valor_pago || 0)
  if (devido <= 0.005 || parcela.vencimento >= hoje) {
    return { dias: 0, multa: 0, mora: 0, total: 0 }
  }
  const dias = Math.max(0, diasEntre(parcela.vencimento, hoje))
  const multa = round2((devido * (contrato.multa_atraso_pct || 0)) / 100)
  const mora = round2((devido * (contrato.juros_mora_mensal || 0)) / 100 * (dias / 30))
  return { dias, multa, mora, total: round2(multa + mora) }
}

// ─── CET (Custo Efetivo Total) via IRR por bisseção ──────────────────────────
// Considera o líquido recebido (principal − IOF − TAC − seguro) e os fluxos das
// parcelas (valor_total). Retorna a taxa mensal em % (ou null se não converge).

export function cetMensal(
  contrato: { valor_principal: number; iof: number; tac: number; seguro: number },
  parcelas: { valor_total: number }[]
): number | null {
  const liquido =
    contrato.valor_principal - (contrato.iof || 0) - (contrato.tac || 0) - (contrato.seguro || 0)
  const fluxos = parcelas.map(p => p.valor_total).filter(v => v > 0)
  if (liquido <= 0 || fluxos.length === 0) return null

  const npv = (i: number) => {
    let v = liquido
    for (let k = 0; k < fluxos.length; k++) v -= fluxos[k] / Math.pow(1 + i, k + 1)
    return v
  }

  let lo = -0.9
  let hi = 5
  let flo = npv(lo)
  const fhi = npv(hi)
  if (flo === 0) return lo * 100
  if (fhi === 0) return hi * 100
  if (flo * fhi > 0) return null

  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2
    const fm = npv(mid)
    if (Math.abs(fm) < 1e-7) return mid * 100
    if (flo * fm < 0) {
      hi = mid
    } else {
      lo = mid
      flo = fm
    }
  }
  return ((lo + hi) / 2) * 100
}

// ─── Resumo consolidado de um contrato (para a tela de detalhe) ──────────────

export type ResumoContrato = {
  saldoDevedor: number
  totalContratado: number
  totalPago: number
  totalJuros: number
  qtdParcelas: number
  qtdPagas: number
  qtdAtrasadas: number
  emAtraso: number
  encargosAtraso: number
  valorAtualizado: number // saldo devedor + encargos de atraso
  custoTotal: number // juros + IOF + TAC + seguro
  cetMensal: number | null
  cetAnual: number | null
  proximaParcela: string | null
  progresso: number // 0..1
}

type ContratoResumo = Pick<
  Emprestimo,
  'valor_principal' | 'multa_atraso_pct' | 'juros_mora_mensal' | 'iof' | 'tac' | 'seguro'
>

export function resumoContrato(
  contrato: ContratoResumo,
  parcelas: EmprestimoParcela[],
  hoje: string = hojeISO()
): ResumoContrato {
  const totalContratado = parcelas.reduce((a, p) => a + (p.valor_total || 0), 0)
  const totalPago = parcelas.reduce((a, p) => a + (p.valor_pago || 0), 0)
  const totalJuros = parcelas.reduce((a, p) => a + (p.valor_juros || 0), 0)
  const atrasadas = parcelas.filter(p => statusParcela(p, hoje) === 'atrasada')
  const emAtraso = atrasadas.reduce(
    (a, p) => a + Math.max(0, (p.valor_total || 0) - (p.valor_pago || 0)),
    0
  )
  const encargos = parcelas.reduce((a, p) => a + encargosAtraso(p, contrato, hoje).total, 0)
  const proxima = parcelas
    .filter(p => (p.valor_pago || 0) < (p.valor_total || 0))
    .map(p => p.vencimento)
    .sort()[0]
  const qtdPagas = parcelas.filter(p => statusParcela(p, hoje) === 'paga').length
  const saldo = saldoDevedorAtual(contrato, parcelas, hoje)
  const custoTotal = totalJuros + (contrato.iof || 0) + (contrato.tac || 0) + (contrato.seguro || 0)
  const cet = cetMensal(contrato, parcelas)

  return {
    saldoDevedor: saldo,
    totalContratado: round2(totalContratado),
    totalPago: round2(totalPago),
    totalJuros: round2(totalJuros),
    qtdParcelas: parcelas.length,
    qtdPagas,
    qtdAtrasadas: atrasadas.length,
    emAtraso: round2(emAtraso),
    encargosAtraso: round2(encargos),
    valorAtualizado: round2(Math.max(0, saldo) + encargos),
    custoTotal: round2(custoTotal),
    cetMensal: cet,
    cetAnual: cet === null ? null : mensalParaAnual(cet),
    proximaParcela: proxima ?? null,
    progresso: totalContratado > 0 ? totalPago / totalContratado : 0,
  }
}

// ─── Série para o gráfico de evolução do saldo devedor ───────────────────────

export type PontoEvolucao = {
  mes: string // 'MM/AA'
  saldo: number
  pagoAcumulado: number
}

export function serieEvolucao(
  contrato: Pick<Emprestimo, 'valor_principal'>,
  parcelas: EmprestimoParcela[]
): PontoEvolucao[] {
  const ordered = [...parcelas].sort((a, b) => a.numero - b.numero)
  let pagoAcum = 0
  const pts: PontoEvolucao[] = ordered.map(p => {
    pagoAcum += p.valor_pago || 0
    const [y, m] = p.vencimento.split('-')
    return {
      mes: `${m}/${y.slice(2)}`,
      saldo: round2(p.saldo_final),
      pagoAcumulado: round2(pagoAcum),
    }
  })
  // ponto inicial (mês 0 = principal)
  return [
    { mes: 'Início', saldo: round2(contrato.valor_principal), pagoAcumulado: 0 },
    ...pts,
  ]
}
