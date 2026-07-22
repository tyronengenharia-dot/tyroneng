import jsPDF from 'jspdf'
import autoTable, { Styles, RowInput } from 'jspdf-autotable'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import {
  GrupoEtapa,
  ItemSemComposicao,
  LinhaInsumo,
  TIPOS,
  TIPO_LABEL,
  agruparPorTipo,
  totaisPorTipo,
} from '@/lib/listaCompras'

// ─────────────────────────────────────────────────────────────────────────────
// Exportação da Lista de Compras da obra (PDF + CSV). Segue o padrão das demais
// exportações: fundo branco, texto escuro, logo da empresa (ou /logo-pdf.png).
// ─────────────────────────────────────────────────────────────────────────────

export type ListaComprasPdfModo = 'consolidada' | 'cronograma'

type ObraInfo = { name: string; client?: string | null; location?: string | null }
type RGB = [number, number, number]

const INK: RGB = [17, 17, 17]
const INK_SOFT: RGB = [88, 88, 88]
const MUTED: RGB = [140, 140, 140]
const HAIR: RGB = [224, 224, 224]

const PW = 210
const M = 14
const FOOT_TOP = 297 - 12

const fmtQty = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

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
    let dataUrl: string
    if (src.startsWith('data:')) {
      dataUrl = src
    } else {
      const res = await fetch(src)
      if (!res.ok) return null
      const blob = await res.blob()
      dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = reject
        fr.readAsDataURL(blob)
      })
    }
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

export async function exportListaComprasPdf(opts: {
  obra: ObraInfo
  modo: ListaComprasPdfModo
  consolidado: LinhaInsumo[]
  grupos: GrupoEtapa[]
  semComposicao: ItemSemComposicao[]
  leadDias: number
  logoDataUrl?: string
}): Promise<void> {
  const { obra, modo, consolidado, grupos, semComposicao, leadDias } = opts
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logo = await loadImageDataUrl(opts.logoDataUrl || '/logo-pdf.png')

  const emitidoEm = new Date()
  const dataLabel = emitidoEm.toLocaleDateString('pt-BR')
  const horaLabel = emitidoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  function drawTopHeader() {
    if (logo) {
      const h = 11
      const w = h * logo.ratio
      try { doc.addImage(logo.dataUrl, 'PNG', M, 8, w, h) } catch { /* ignore */ }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK)
    doc.text('LISTA DE COMPRAS', PW - M, 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...INK_SOFT)
    doc.text(obra.name, PW - M, 16.5, { align: 'right' })
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(`Emitido em ${dataLabel}`, PW - M, 20.5, { align: 'right' })
    doc.setDrawColor(...INK)
    doc.setLineWidth(0.5)
    doc.line(M, 25.5, PW - M, 25.5)
  }

  const insumoHead = [['Código', 'Insumo', 'Qtd', 'Un.', 'Valor Unit.', 'Total']]
  const insumoColStyles: { [k: number]: Partial<Styles> } = {
    0: { cellWidth: 24, textColor: MUTED as RGB },
    1: { cellWidth: 'auto' as const },
    2: { cellWidth: 20, halign: 'right' as const },
    3: { cellWidth: 14, halign: 'center' as const },
    4: { cellWidth: 26, halign: 'right' as const },
    5: { cellWidth: 28, halign: 'right' as const },
  }
  const bodyOf = (insumos: LinhaInsumo[]): RowInput[] =>
    insumos.map(i => [i.codigo, i.descricao, fmtQty(i.quantidade), i.unidade, fmtCurrency(i.valor_unitario), fmtCurrency(i.total)])

  function sectionTitle(txt: string, sub?: string) {
    const prev = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    let y = prev ? prev.finalY + 9 : 34
    if (y > FOOT_TOP - 24) { doc.addPage(); drawTopHeader(); y = 34 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    doc.text(txt, M, y)
    if (sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      doc.text(sub, PW - M, y, { align: 'right' })
    }
    return y + 2
  }

  function insumoTable(insumos: LinhaInsumo[], startY: number, totalLabel: string) {
    const total = insumos.reduce((s, i) => s + i.total, 0)
    autoTable(doc, {
      startY,
      margin: { top: 31, left: M, right: M, bottom: 16 },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: INK as RGB, lineColor: HAIR as RGB, lineWidth: 0.1 },
      headStyles: { fillColor: INK as RGB, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [245, 245, 245], textColor: INK as RGB, fontStyle: 'bold' },
      showFoot: 'lastPage',
      head: insumoHead,
      body: bodyOf(insumos),
      foot: [[{ content: totalLabel, colSpan: 5, styles: { halign: 'right' as const } }, fmtCurrency(total)]],
      columnStyles: insumoColStyles,
      didDrawPage: drawTopHeader,
    })
  }

  drawTopHeader()

  // ── Cabeçalho + resumo por tipo ────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...INK)
  doc.text(obra.name, M, 34)
  const sub = [obra.client, obra.location].filter(Boolean).join('   ·   ')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK_SOFT)
  if (sub) doc.text(sub, M, 40)

  const tot = totaisPorTipo(consolidado)
  const totalGeral = tot.material + tot.mao_de_obra + tot.equipamento
  const resumo: [string, string][] = [
    ['Materiais', fmtCurrency(tot.material)],
    ['Mão de obra', fmtCurrency(tot.mao_de_obra)],
    ['Equipamentos', fmtCurrency(tot.equipamento)],
    ['Total da obra', fmtCurrency(totalGeral)],
  ]
  autoTable(doc, {
    startY: 44,
    margin: { left: M, right: M },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
    body: [resumo.map(r => `${r[0]}: ${r[1]}`)],
    columnStyles: { 0: {}, 1: {}, 2: {}, 3: { fontStyle: 'bold' as const } },
    didParseCell: d => { if (d.column.index === 3) d.cell.styles.textColor = [22, 120, 74] },
  })

  if (modo === 'consolidada') {
    for (const g of agruparPorTipo(consolidado)) {
      const y = sectionTitle(TIPO_LABEL[g.tipo], `${g.insumos.length} itens`)
      insumoTable(g.insumos, y, `Subtotal ${TIPO_LABEL[g.tipo].toLowerCase()}`)
    }
  } else {
    for (const g of grupos) {
      const nome = g.etapa ? `${g.etapa.ordem}. ${g.etapa.nome}` : 'Serviços sem etapa'
      const quando = g.comprarAte
        ? `Comprar até ${fmtDate(g.comprarAte)}  ·  início ${fmtDate(g.etapa!.data_inicio)}`
        : 'Vincule ao cronograma para definir a data'
      const y = sectionTitle(nome, quando)
      insumoTable(g.insumos, y, 'Subtotal da etapa')
    }
  }

  if (semComposicao.length > 0) {
    const y = sectionTitle('Itens sem detalhamento', 'SINAPI / EMOP / texto livre')
    autoTable(doc, {
      startY: y,
      margin: { top: 31, left: M, right: M, bottom: 16 },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: INK as RGB, lineColor: HAIR as RGB, lineWidth: 0.1 },
      headStyles: { fillColor: INK as RGB, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      head: [['Código', 'Descrição', 'Qtd', 'Un.', 'Valor Unit.', 'Total']],
      body: semComposicao.map(i => [i.codigo, i.descricao, fmtQty(i.quantidade), i.unidade, fmtCurrency(i.valor_unitario), fmtCurrency(i.total)]),
      columnStyles: insumoColStyles,
      didDrawPage: drawTopHeader,
    })
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...HAIR)
    doc.setLineWidth(0.2)
    doc.line(M, FOOT_TOP, PW - M, FOOT_TOP)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    const antec = leadDias > 0 ? `  ·  antecedência de compra: ${leadDias} dia(s)` : ''
    doc.text(`Tyron Engenharia${antec}`, M, FOOT_TOP + 4)
    doc.text(`Gerado em ${dataLabel} às ${horaLabel}`, PW / 2, FOOT_TOP + 4, { align: 'center' })
    doc.text(`Página ${p} de ${totalPages}`, PW - M, FOOT_TOP + 4, { align: 'right' })
  }

  doc.save(`Lista_Compras_${slug(obra.name)}_${emitidoEm.toISOString().slice(0, 10)}.pdf`)
}

// ── CSV (abre no Excel; separador ';' + decimais com vírgula pt-BR) ──────────

export function exportListaComprasCsv(opts: {
  obraName: string
  consolidado: LinhaInsumo[]
  semComposicao: ItemSemComposicao[]
}): void {
  const { obraName, consolidado, semComposicao } = opts
  const dec = (n: number) => (Math.round(n * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
  const linhas: string[] = []
  linhas.push(['Tipo', 'Código', 'Insumo', 'Quantidade', 'Unidade', 'Valor unitário', 'Total'].join(';'))

  for (const tipo of TIPOS) {
    for (const i of consolidado.filter(x => x.tipo === tipo)) {
      linhas.push([esc(TIPO_LABEL[tipo]), esc(i.codigo), esc(i.descricao), dec(i.quantidade), esc(i.unidade), dec(i.valor_unitario), dec(i.total)].join(';'))
    }
  }
  for (const i of semComposicao) {
    linhas.push([esc('Sem detalhamento'), esc(i.codigo), esc(i.descricao), dec(i.quantidade), esc(i.unidade), dec(i.valor_unitario), dec(i.total)].join(';'))
  }

  const bom = '﻿' // faz o Excel reconhecer UTF-8 (acentos)
  const blob = new Blob([bom + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Lista_Compras_${slug(obraName)}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
