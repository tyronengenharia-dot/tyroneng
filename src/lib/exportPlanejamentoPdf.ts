import jsPDF from 'jspdf'
import autoTable, { Styles } from 'jspdf-autotable'
import { Etapa, EtapaStatus } from '@/types'
import { fmtDate, fmtCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Exportação premium do Cronograma Físico-Financeiro (aba Planejamento).
// Documento pronto para enviar ao cliente: capa com marca, resumo executivo,
// gráfico de Gantt vetorial e detalhamento das etapas.
// Segue o padrão print-friendly das demais exportações (fundo branco, texto
// escuro), elevando o acabamento para uso externo.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanejamentoPdfMode = 'completo' | 'resumo'

type ObraInfo = { name: string; client?: string | null; location?: string | null }

/** Dados do contrato para a capa (todos opcionais; capa usa defaults da obra). */
export type ContratoInfo = {
  numero?: string
  objeto?: string
  contratante?: string
  contratada?: string
  local?: string
  valor?: number
  dataAssinatura?: string // 'YYYY-MM-DD'
}

/** Responsável técnico para o bloco de assinatura. */
export type ResponsavelInfo = {
  nome?: string
  titulo?: string // ex.: 'Engenheiro Civil'
  crea?: string
}

type RGB = [number, number, number]

// ── Paleta ───────────────────────────────────────────────────────────────────
const INK: RGB        = [17, 17, 17]
const INK_SOFT: RGB   = [88, 88, 88]
const MUTED: RGB      = [140, 140, 140]
const HAIR: RGB       = [224, 224, 224]
const TRACK: RGB      = [236, 236, 236]
const ALT_MONTH: RGB  = [248, 248, 248]

const STATUS_COLOR: Record<EtapaStatus, RGB> = {
  concluida:    [22, 163, 74],
  em_andamento: [37, 99, 235],
  planejada:    [148, 163, 184],
  atrasada:     [220, 38, 38],
}
const STATUS_LABEL: Record<EtapaStatus, string> = {
  concluida:    'Concluída',
  em_andamento: 'Em andamento',
  planejada:    'Planejada',
  atrasada:     'Atrasada',
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ── Geometria da página ──────────────────────────────────────────────────────
const PW = 210
const PH = 297
const M = 14
const HEADER_RULE_Y = 25.5
const CONTENT_TOP = 31
const FOOT_TOP = PH - 12

// ── Helpers numéricos / texto ────────────────────────────────────────────────
const clampPct = (n: number) => Math.max(0, Math.min(100, n || 0))
const tint = (c: RGB, amt: number): RGB => [
  Math.round(c[0] + (255 - c[0]) * amt),
  Math.round(c[1] + (255 - c[1]) * amt),
  Math.round(c[2] + (255 - c[2]) * amt),
]
// 'YYYY-MM-DD' → Date local (sem deslocamento de fuso)
const parseLocal = (s: string): Date | null => {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
const fmtD = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
// 'YYYY-MM-DD' → 'dd/mm/yy' (compacto, p/ a tabela financeira estreita)
const fmtDmy2 = (s: string) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y.slice(2)}`
}
const slug = (s: string) =>
  (s || '')
    .normalize('NFD')
    .split('')
    .filter(ch => ch.charCodeAt(0) <= 127)
    .join('')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'obra'

async function loadImageDataUrl(src: string): Promise<{ dataUrl: string; ratio: number } | null> {
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = reject
      fr.readAsDataURL(blob)
    })
    const ratio = await new Promise<number>(resolve => {
      const img = new window.Image()
      img.onload = () => resolve(img.width && img.height ? img.width / img.height : 1)
      img.onerror = () => resolve(1)
      img.src = dataUrl
    })
    return { dataUrl, ratio }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function exportPlanejamentoPdf(opts: {
  obra: ObraInfo
  etapas: Etapa[]
  mode: PlanejamentoPdfMode
  contrato?: ContratoInfo
  responsavel?: ResponsavelInfo
  capa?: boolean
}): Promise<void> {
  const { obra, etapas, mode, contrato, responsavel } = opts
  const capa = opts.capa !== false
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logo = await loadImageDataUrl('/logo-pdf.png')

  const emitidoEm = new Date()
  const dataLabel = emitidoEm.toLocaleDateString('pt-BR')
  const horaLabel = emitidoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // ── Métricas agregadas ─────────────────────────────────────────────────────
  const valorPrevisto  = etapas.reduce((s, e) => s + (e.valor || 0), 0)
  const valorRealizado = etapas.reduce((s, e) => s + (e.valor || 0) * clampPct(e.percentual_financeiro) / 100, 0)
  const temValores = valorPrevisto > 0
  const durs = etapas.map(e => Math.max(0, e.duracao_dias || 0))
  const sumDur = durs.reduce((a, b) => a + b, 0)
  const wAvg = (vals: number[]) => {
    if (sumDur > 0) return vals.reduce((s, v, i) => s + clampPct(v) * durs[i], 0) / sumDur
    if (vals.length === 0) return 0
    return vals.reduce((s, v) => s + clampPct(v), 0) / vals.length
  }
  const avancoFisico = wAvg(etapas.map(e => e.percentual_fisico))
  const avancoFinanceiro = wAvg(etapas.map(e => e.percentual_financeiro))
  const concluidas = etapas.filter(e => e.status === 'concluida').length
  const atrasadas = etapas.filter(e => e.status === 'atrasada').length

  const startDates = etapas.map(e => parseLocal(e.data_inicio)).filter(Boolean) as Date[]
  const endDates = etapas.map(e => parseLocal(e.data_fim)).filter(Boolean) as Date[]
  const projStart = startDates.length ? new Date(Math.min(...startDates.map(d => d.getTime()))) : emitidoEm
  const projEnd = endDates.length ? new Date(Math.max(...endDates.map(d => d.getTime()))) : emitidoEm
  const totalDias = Math.max(1, Math.round((projEnd.getTime() - projStart.getTime()) / 86400000) + 1)

  const hoje = new Date(emitidoEm.getFullYear(), emitidoEm.getMonth(), emitidoEm.getDate())
  let statusGeral: { label: string; color: RGB }
  if (atrasadas > 0 || (hoje > projEnd && concluidas < etapas.length)) {
    statusGeral = { label: 'Atrasada', color: STATUS_COLOR.atrasada }
  } else if (etapas.length > 0 && concluidas === etapas.length) {
    statusGeral = { label: 'Concluída', color: STATUS_COLOR.concluida }
  } else {
    statusGeral = { label: 'Em andamento', color: STATUS_COLOR.em_andamento }
  }

  // ── Chrome (cabeçalho de marca repetido em todas as páginas) ────────────────
  function drawTopHeader() {
    if (logo) {
      const h = 11
      const w = h * logo.ratio
      try { doc.addImage(logo.dataUrl, 'PNG', M, 8, w, h) } catch { /* ignore */ }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK)
    doc.text('CRONOGRAMA FÍSICO-FINANCEIRO', PW - M, 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...INK_SOFT)
    doc.text(obra.name, PW - M, 16.5, { align: 'right' })
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(`Emitido em ${dataLabel}`, PW - M, 20.5, { align: 'right' })

    doc.setDrawColor(...INK)
    doc.setLineWidth(0.5)
    doc.line(M, HEADER_RULE_Y, PW - M, HEADER_RULE_Y)
  }

  // ── KPI card ────────────────────────────────────────────────────────────────
  function kpiCard(x: number, y: number, w: number, h: number, label: string, value: string, sub?: string) {
    doc.setDrawColor(...HAIR)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 1.6, 1.6, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.6)
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), x + 3.4, y + 5.2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(...INK)
    doc.text(value, x + 3.4, y + 12.4)
    if (sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(...MUTED)
      doc.text(sub, x + 3.4, y + h - 2.8)
    }
  }

  // ── Capa dedicada com dados do contrato ─────────────────────────────────────
  function drawCover() {
    const cx = PW / 2
    // Logo centralizado
    if (logo) {
      const h = 26
      const w = h * logo.ratio
      try { doc.addImage(logo.dataUrl, 'PNG', cx - w / 2, 34, w, h) } catch { /* ignore */ }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text('TYRON ENGENHARIA', cx, 70, { align: 'center', charSpace: 0.8 })
    doc.setDrawColor(...INK)
    doc.setLineWidth(0.4)
    doc.line(cx - 16, 74, cx + 16, 74)

    // Tipo de documento + obra
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('CRONOGRAMA FÍSICO-FINANCEIRO', cx, 104, { align: 'center', charSpace: 1.4 })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(21)
    doc.setTextColor(...INK)
    const nameLines = doc.splitTextToSize(obra.name, PW - 50) as string[]
    let ny = 116
    nameLines.forEach(ln => { doc.text(ln, cx, ny, { align: 'center' }); ny += 9 })
    const subtitle = [contrato?.contratante || obra.client, contrato?.local || obra.location].filter(Boolean).join('   ·   ')
    if (subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(...INK_SOFT)
      doc.text(subtitle, cx, ny + 1, { align: 'center' })
      ny += 8
    }

    // Painel "Dados do contrato"
    const rows: [string, string][] = []
    if (contrato?.numero) rows.push(['Contrato nº', contrato.numero])
    rows.push(['Objeto', contrato?.objeto || obra.name])
    rows.push(['Contratante', contrato?.contratante || obra.client || '—'])
    rows.push(['Contratada', contrato?.contratada || 'Tyron Engenharia'])
    if (contrato?.local || obra.location) rows.push(['Local', contrato?.local || obra.location || ''])
    const vContrato = contrato?.valor ?? (temValores ? valorPrevisto : undefined)
    if (vContrato) rows.push(['Valor do contrato', fmtCurrency(vContrato)])
    rows.push(['Prazo de execução', `${fmtD(projStart)} a ${fmtD(projEnd)}   ·   ${totalDias} dias`])
    if (contrato?.dataAssinatura) rows.push(['Assinatura do contrato', fmtDate(contrato.dataAssinatura)])
    if (responsavel?.nome) {
      rows.push(['Responsável técnico', [responsavel.nome, responsavel.crea && `CREA ${responsavel.crea}`].filter(Boolean).join('   ·   ')])
    }

    const panelX = 26
    const panelW = PW - 2 * panelX
    const rowH = 10
    const padTop = 9
    const panelY = Math.max(ny + 8, 150)
    const panelH = padTop + rows.length * rowH + 3
    doc.setDrawColor(...HAIR)
    doc.setLineWidth(0.3)
    doc.roundedRect(panelX, panelY, panelW, panelH, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text('DADOS DO CONTRATO', panelX + 6, panelY + 6, { charSpace: 0.6 })

    let ry = panelY + padTop + 4
    const labelX = panelX + 6
    const valX = panelX + 52
    rows.forEach((r, i) => {
      if (i > 0) {
        doc.setDrawColor(...HAIR)
        doc.setLineWidth(0.15)
        doc.line(panelX + 6, ry - 5.4, panelX + panelW - 6, ry - 5.4)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.6)
      doc.setTextColor(...MUTED)
      doc.text(r[0].toUpperCase(), labelX, ry)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...INK)
      const vLines = doc.splitTextToSize(r[1], panelW - 52 - 8) as string[]
      doc.text(vLines[0] ?? '', valX, ry)
      ry += rowH
    })

    // Rodapé da capa
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`Emitido em ${dataLabel} às ${horaLabel}`, cx, PH - 22, { align: 'center' })
  }

  if (capa) {
    drawCover()
    doc.addPage()
  }

  // ── Página de resumo: bloco de título + resumo executivo ────────────────────
  drawTopHeader()
  let y = 34

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...INK)
  doc.text(obra.name, M, y)

  // Pílula de status geral (à direita)
  const pill = statusGeral.label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const pillW = doc.getTextWidth(pill) + 10
  const pillX = PW - M - pillW
  doc.setFillColor(...tint(statusGeral.color, 0.85))
  doc.roundedRect(pillX, y - 5, pillW, 7, 3.5, 3.5, 'F')
  doc.setTextColor(...statusGeral.color)
  doc.text(pill, pillX + pillW / 2, y - 0.4, { align: 'center' })

  y += 6
  const sub = [obra.client, obra.location].filter(Boolean).join('   ·   ')
  if (sub) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK_SOFT)
    doc.text(sub, M, y)
    y += 6
  } else {
    y += 1
  }

  // Resumo executivo
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('RESUMO EXECUTIVO', M, y)
  y += 3

  const gap = 3.2
  const cardW = (PW - 2 * M - 3 * gap) / 4
  const cardH = 18
  const periodo = `${fmtD(projStart)} — ${fmtD(projEnd)}`
  kpiCard(M, y, cardW, cardH, 'Avanço físico', `${avancoFisico.toFixed(1)}%`, 'ponderado por duração')
  kpiCard(M + (cardW + gap), y, cardW, cardH, 'Avanço financeiro', `${avancoFinanceiro.toFixed(1)}%`, 'ponderado por duração')
  kpiCard(M + 2 * (cardW + gap), y, cardW, cardH, 'Etapas', `${concluidas}/${etapas.length}`, 'concluídas')
  kpiCard(M + 3 * (cardW + gap), y, cardW, cardH, 'Prazo total', `${totalDias} dias`, periodo)
  y += cardH + 7

  // Linha financeira (quando há valor por etapa)
  if (temValores) {
    const fGap = 3.2
    const fW = (PW - 2 * M - 2 * fGap) / 3
    kpiCard(M, y, fW, cardH, 'Valor previsto', fmtCurrency(valorPrevisto))
    kpiCard(M + (fW + fGap), y, fW, cardH, 'Valor realizado', fmtCurrency(valorRealizado),
      `${((valorRealizado / valorPrevisto) * 100).toFixed(1)}% do previsto`)
    kpiCard(M + 2 * (fW + fGap), y, fW, cardH, 'A realizar', fmtCurrency(valorPrevisto - valorRealizado))
    y += cardH + 7
  }

  // Barra de avanço geral (físico vs financeiro)
  const barX = M
  const barW = PW - 2 * M
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text('AVANÇO GERAL', barX, y)
  y += 2.5
  // trilho
  doc.setFillColor(...TRACK)
  doc.roundedRect(barX, y, barW, 4.5, 2.25, 2.25, 'F')
  // físico
  const fisW = (clampPct(avancoFisico) / 100) * barW
  if (fisW > 0.5) {
    doc.setFillColor(...STATUS_COLOR.em_andamento)
    doc.roundedRect(barX, y, fisW, 4.5, 2.25, 2.25, 'F')
  }
  // marcador financeiro
  const finX = barX + (clampPct(avancoFinanceiro) / 100) * barW
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.6)
  doc.line(finX, y - 1, finX, y + 5.5)
  y += 4.5 + 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  // marcador físico (quadrado azul = preenchimento da barra)
  doc.setFillColor(...STATUS_COLOR.em_andamento)
  doc.rect(barX, y - 2.3, 2.6, 2.6, 'F')
  doc.setTextColor(...INK_SOFT)
  const fisLabel = `Físico ${avancoFisico.toFixed(1)}%`
  doc.text(fisLabel, barX + 4, y)
  // marcador financeiro (traço vertical = marcador da barra)
  const fx = barX + 4 + doc.getTextWidth(fisLabel) + 9
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.6)
  doc.line(fx, y - 2.5, fx, y + 0.5)
  doc.text(`Financeiro ${avancoFinanceiro.toFixed(1)}%`, fx + 3, y)
  y += 6

  // ── Gráfico de Gantt (vetorial, paginado) ──────────────────────────────────
  y = drawGantt(doc, etapas, projStart, projEnd, hoje, y, drawTopHeader)
  let endY = y

  // ── Detalhamento das etapas (modo completo) ─────────────────────────────────
  if (mode === 'completo') {
    endY = drawDetailTable(doc, etapas, temValores, drawTopHeader)
  }

  // ── Bloco de assinatura (responsável técnico / partes) ──────────────────────
  if (responsavel?.nome || capa) {
    drawSignature(doc, endY, {
      local: contrato?.local || obra.location || '',
      contratante: contrato?.contratante || obra.client || '',
      contratada: contrato?.contratada || 'Tyron Engenharia',
      responsavel: responsavel || {},
      emitidoEm,
    }, drawTopHeader)
  }

  // ── Rodapé em todas as páginas ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    if (capa && p === 1) continue // a capa não leva rodapé corrido
    doc.setPage(p)
    doc.setDrawColor(...HAIR)
    doc.setLineWidth(0.2)
    doc.line(M, FOOT_TOP, PW - M, FOOT_TOP)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    doc.text('Tyron Engenharia', M, FOOT_TOP + 4)
    doc.text(`Gerado em ${dataLabel} às ${horaLabel}`, PW / 2, FOOT_TOP + 4, { align: 'center' })
    doc.text(`Página ${p} de ${totalPages}`, PW - M, FOOT_TOP + 4, { align: 'right' })
  }

  doc.save(`Cronograma_${slug(obra.name)}_${emitidoEm.toISOString().slice(0, 10)}.pdf`)
}

// ── Gantt ─────────────────────────────────────────────────────────────────────

function drawGantt(
  doc: jsPDF,
  etapas: Etapa[],
  projStart: Date,
  projEnd: Date,
  hoje: Date,
  startY: number,
  drawTopHeader: () => void,
): number {
  const labelW = 50
  const x0 = M + labelW
  const x1 = PW - M
  const timeW = x1 - x0
  const rowH = 7.4
  const barH = 4.6
  const bottomLimit = FOOT_TOP - 6

  // Eixo alinhado a meses cheios
  const axisStart = new Date(projStart.getFullYear(), projStart.getMonth(), 1)
  const axisEnd = new Date(projEnd.getFullYear(), projEnd.getMonth() + 1, 0)
  const span = Math.max(1, axisEnd.getTime() - axisStart.getTime())
  const xForDate = (d: Date) => x0 + ((d.getTime() - axisStart.getTime()) / span) * timeW

  // Lista de meses do eixo
  const months: { x: number; w: number; label: string; idx: number }[] = []
  const cur = new Date(axisStart)
  let mi = 0
  while (cur <= axisEnd) {
    const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1)
    const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59)
    const sx = xForDate(mStart < axisStart ? axisStart : mStart)
    const ex = xForDate(mEnd > axisEnd ? axisEnd : mEnd)
    months.push({
      x: sx,
      w: Math.max(0.5, ex - sx),
      label: `${MESES[cur.getMonth()]}/${String(cur.getFullYear()).slice(2)}`,
      idx: mi,
    })
    cur.setMonth(cur.getMonth() + 1)
    mi++
  }
  const minLabelW = 12
  const avgMonthW = timeW / Math.max(1, months.length)
  const labelStep = Math.max(1, Math.ceil(minLabelW / Math.max(1, avgMonthW)))

  function drawAxis(topY: number, blockBottom: number): number {
    // Faixas alternadas de mês (fundo) + grades verticais
    months.forEach(m => {
      if (m.idx % 2 === 1) {
        doc.setFillColor(...ALT_MONTH)
        doc.rect(m.x, topY + 6, m.w, blockBottom - (topY + 6), 'F')
      }
    })
    months.forEach(m => {
      doc.setDrawColor(...HAIR)
      doc.setLineWidth(0.15)
      doc.line(m.x, topY + 6, m.x, blockBottom)
      if (m.idx % labelStep === 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.4)
        doc.setTextColor(...MUTED)
        doc.text(m.label, m.x + m.w / 2, topY + 3.6, { align: 'center' })
      }
    })
    // borda direita do bloco
    doc.setDrawColor(...HAIR)
    doc.line(x1, topY + 6, x1, blockBottom)
    // baseline do eixo
    doc.setDrawColor(...INK)
    doc.setLineWidth(0.3)
    doc.line(x0, topY + 6, x1, topY + 6)
    return topY + 6
  }

  function sectionTitle(topY: number, cont: boolean): number {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(cont ? 'Cronograma Físico  (cont.)' : 'Cronograma Físico', M, topY)
    return topY + 3
  }

  function drawTodayMarker(blockTop: number, blockBottom: number) {
    if (hoje < projStart || hoje > projEnd) return
    const tx = xForDate(hoje)
    doc.setDrawColor(...STATUS_COLOR.atrasada)
    doc.setLineWidth(0.4)
    try { doc.setLineDashPattern([1.1, 1.1], 0) } catch { /* ignore */ }
    doc.line(tx, blockTop, tx, blockBottom)
    try { doc.setLineDashPattern([], 0) } catch { /* ignore */ }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...STATUS_COLOR.atrasada)
    doc.text('Hoje', tx, blockTop - 0.8, { align: 'center' })
  }

  // Primeira página do Gantt
  let yy = sectionTitle(startY, false)
  let axisBaseline = drawAxis(yy, bottomLimit)
  let rowsTop = axisBaseline
  let cursor = axisBaseline + 1

  const drawRow = (etapa: Etapa, ry: number) => {
    const start = parseLocal(etapa.data_inicio)
    const end = parseLocal(etapa.data_fim)
    const midY = ry + rowH / 2
    // Rótulo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    doc.setTextColor(...MUTED)
    doc.text(`${etapa.ordem}.`, M, midY + 1.2)
    doc.setTextColor(...INK)
    let nome = etapa.nome || ''
    const maxNomeW = labelW - 9
    while (doc.getTextWidth(nome) > maxNomeW && nome.length > 1) nome = nome.slice(0, -1)
    if (nome !== (etapa.nome || '')) nome = nome.slice(0, -1) + '…'
    doc.text(nome, M + 5, midY + 1.2)

    if (!start || !end) return
    const color = STATUS_COLOR[etapa.status]
    const bx0 = xForDate(start)
    const bx1 = xForDate(end)
    const bw = Math.max(1.6, bx1 - bx0)
    const by = midY - barH / 2
    // trilho (duração total, tom claro)
    doc.setFillColor(...tint(color, 0.78))
    doc.roundedRect(bx0, by, bw, barH, 1.2, 1.2, 'F')
    // executado (% físico)
    const pf = clampPct(etapa.percentual_fisico)
    const doneW = (pf / 100) * bw
    if (doneW > 0.4) {
      doc.setFillColor(...color)
      doc.roundedRect(bx0, by, Math.max(1, doneW), barH, 1.2, 1.2, 'F')
    }
    // contorno
    doc.setDrawColor(...color)
    doc.setLineWidth(0.25)
    doc.roundedRect(bx0, by, bw, barH, 1.2, 1.2, 'S')
    // rótulo de %
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    if (bw > 12) {
      doc.setTextColor(255, 255, 255)
      doc.text(`${pf}%`, bx0 + 1.6, midY + 1)
    } else {
      doc.setTextColor(...INK_SOFT)
      const tx = bx1 + 1.4
      if (tx < x1 - 6) doc.text(`${pf}%`, tx, midY + 1)
    }
  }

  for (const etapa of etapas) {
    if (cursor + rowH > bottomLimit) {
      drawTodayMarker(rowsTop, cursor)
      doc.addPage()
      drawTopHeader()
      yy = sectionTitle(CONTENT_TOP + 3, true)
      axisBaseline = drawAxis(yy, bottomLimit)
      rowsTop = axisBaseline
      cursor = axisBaseline + 1
    }
    drawRow(etapa, cursor)
    cursor += rowH
  }
  drawTodayMarker(rowsTop, cursor)

  // Legenda
  let lx = M
  const ly = cursor + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  ;(['concluida', 'em_andamento', 'planejada', 'atrasada'] as EtapaStatus[]).forEach(st => {
    doc.setFillColor(...STATUS_COLOR[st])
    doc.roundedRect(lx, ly - 2.4, 3, 3, 0.6, 0.6, 'F')
    doc.setTextColor(...INK_SOFT)
    doc.text(STATUS_LABEL[st], lx + 4.2, ly)
    lx += doc.getTextWidth(STATUS_LABEL[st]) + 12
  })
  doc.setFontSize(6.4)
  doc.setTextColor(...MUTED)
  doc.text('Barra clara = duração planejada · preenchimento = % físico executado · linha tracejada = hoje', M, ly + 4.5)

  return ly + 9
}

// ── Tabela de detalhamento ─────────────────────────────────────────────────────

function drawDetailTable(doc: jsPDF, etapas: Etapa[], temValores: boolean, drawTopHeader: () => void): number {
  doc.addPage()
  drawTopHeader()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text('Detalhamento das Etapas', M, CONTENT_TOP + 4)

  const realizadoEtapa = (e: Etapa) => (e.valor || 0) * clampPct(e.percentual_financeiro) / 100
  const statusCol = temValores ? 8 : 7

  const head = temValores
    ? [['#', 'Etapa', 'Início', 'Fim', 'Dur.', '% Fís.', 'Valor Prev.', 'Valor Realiz.', 'Status']]
    : [['#', 'Etapa', 'Início', 'Fim', 'Duração', '% Físico', '% Financ.', 'Status']]

  const body = etapas.map(e => {
    const ini = temValores ? fmtDmy2(e.data_inicio) : fmtDate(e.data_inicio)
    const fim = temValores ? fmtDmy2(e.data_fim) : fmtDate(e.data_fim)
    const base = [String(e.ordem), e.nome || '', ini, fim, `${e.duracao_dias}d`, `${clampPct(e.percentual_fisico)}%`]
    return temValores
      ? [...base, fmtCurrency(e.valor || 0), fmtCurrency(realizadoEtapa(e)), STATUS_LABEL[e.status]]
      : [...base, `${clampPct(e.percentual_financeiro)}%`, STATUS_LABEL[e.status]]
  })

  const columnStyles: { [key: number]: Partial<Styles> } = temValores
    ? {
        0: { cellWidth: 8, halign: 'center' as const, textColor: MUTED as RGB },
        1: { cellWidth: 'auto' as const, fontStyle: 'bold' as const },
        2: { cellWidth: 17, halign: 'center' as const },
        3: { cellWidth: 17, halign: 'center' as const },
        4: { cellWidth: 12, halign: 'center' as const },
        5: { cellWidth: 16, halign: 'right' as const },
        6: { cellWidth: 26, halign: 'right' as const },
        7: { cellWidth: 26, halign: 'right' as const },
        8: { cellWidth: 22, halign: 'center' as const },
      }
    : {
        0: { cellWidth: 9, halign: 'center' as const, textColor: MUTED as RGB },
        1: { cellWidth: 'auto' as const, fontStyle: 'bold' as const },
        2: { cellWidth: 20, halign: 'center' as const },
        3: { cellWidth: 20, halign: 'center' as const },
        4: { cellWidth: 17, halign: 'center' as const },
        5: { cellWidth: 22, halign: 'right' as const },
        6: { cellWidth: 20, halign: 'right' as const },
        7: { cellWidth: 26, halign: 'center' as const },
      }

  const foot = temValores
    ? [[
        { content: 'TOTAL', colSpan: 6, styles: { halign: 'right' as const } },
        fmtCurrency(etapas.reduce((s, e) => s + (e.valor || 0), 0)),
        fmtCurrency(etapas.reduce((s, e) => s + realizadoEtapa(e), 0)),
        '',
      ]]
    : undefined

  autoTable(doc, {
    startY: CONTENT_TOP + 8,
    margin: { top: CONTENT_TOP, left: M, right: M, bottom: 16 },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: INK as RGB, lineColor: HAIR as RGB, lineWidth: 0.1 },
    headStyles: { fillColor: INK as RGB, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: INK as RGB, textColor: [255, 255, 255], fontStyle: 'bold' },
    showFoot: 'lastPage',
    head,
    body,
    foot,
    columnStyles,
    didParseCell: data => {
      if (data.section === 'body' && data.column.index === statusCol) {
        const st = etapas[data.row.index]?.status
        if (st) data.cell.styles.textColor = STATUS_COLOR[st]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawCell: data => {
      // mini barra de progresso na coluna % Físico (índice 5 em ambos os layouts)
      if (data.section === 'body' && data.column.index === 5) {
        const e = etapas[data.row.index]
        if (!e) return
        const pf = clampPct(e.percentual_fisico)
        const pad = 2
        const bx = data.cell.x + pad
        const bw = data.cell.width - pad * 2
        const by = data.cell.y + data.cell.height - 2.4
        doc.setFillColor(...TRACK)
        doc.roundedRect(bx, by, bw, 1.1, 0.55, 0.55, 'F')
        if (pf > 0) {
          doc.setFillColor(...(e.status === 'concluida' ? STATUS_COLOR.concluida : STATUS_COLOR.em_andamento))
          doc.roundedRect(bx, by, (pf / 100) * bw, 1.1, 0.55, 0.55, 'F')
        }
      }
    },
    didDrawPage: drawTopHeader,
  })

  const lat = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  return lat?.finalY ?? CONTENT_TOP + 8
}

// ── Bloco de assinatura ─────────────────────────────────────────────────────────

const MESES_EXT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function drawSignature(
  doc: jsPDF,
  afterY: number,
  info: {
    local: string
    contratante: string
    contratada: string
    responsavel: ResponsavelInfo
    emitidoEm: Date
  },
  drawTopHeader: () => void,
) {
  let sy = Math.max(afterY + 22, PH - 72)
  if (sy + 34 > FOOT_TOP) {
    doc.addPage()
    drawTopHeader()
    sy = PH - 72
  }

  const d = info.emitidoEm
  const localData = `${info.local ? info.local + ', ' : ''}${d.getDate()} de ${MESES_EXT[d.getMonth()]} de ${d.getFullYear()}`
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...INK_SOFT)
  doc.text(localData, PW - M, sy, { align: 'right' })

  const lineY = sy + 26
  const colW = (PW - 2 * M - 18) / 2
  const leftCx = M + colW / 2
  const rightCx = PW - M - colW / 2
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.3)
  doc.line(leftCx - colW / 2 + 4, lineY, leftCx + colW / 2 - 4, lineY)
  doc.line(rightCx - colW / 2 + 4, lineY, rightCx + colW / 2 - 4, lineY)

  // Esquerda — contratada / responsável técnico
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(info.responsavel.nome || info.contratada, leftCx, lineY + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(...MUTED)
  const rtLine = [info.responsavel.titulo || 'Responsável Técnico', info.responsavel.crea && `CREA ${info.responsavel.crea}`].filter(Boolean).join('   ·   ')
  doc.text(rtLine, leftCx, lineY + 9.5, { align: 'center' })
  doc.text(`${info.contratada} — Contratada`, leftCx, lineY + 13.5, { align: 'center' })

  // Direita — contratante
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(info.contratante || '—', rightCx, lineY + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(...MUTED)
  doc.text('Contratante', rightCx, lineY + 9.5, { align: 'center' })
}
