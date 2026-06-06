import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'
import { fmtCurrency } from '@/lib/utils'
import { PlanilhaItem, PlanilhaCategoria } from '@/types'

type CatComItens = PlanilhaCategoria & { itens: PlanilhaItem[] }

export type PlanilhaPdfMode = 'resumo' | 'completa'

type ObraInfo = { name: string; client?: string | null; location?: string | null }

const fmtQtd = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
const calcCat = (itens: PlanilhaItem[]) =>
  itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)

// Cores (print-friendly: fundo branco, texto escuro)
const HEAD_FILL: [number, number, number] = [24, 24, 24]
const CAT_FILL: [number, number, number]  = [232, 232, 232]
const FOOT_FILL: [number, number, number] = [24, 24, 24]

export function exportPlanilhaPdf(opts: {
  obra: ObraInfo
  titulo: string
  categorias: CatComItens[]
  mode: PlanilhaPdfMode
}) {
  const { obra, titulo, categorias, mode } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const M = 14

  const totalGeral = categorias.reduce((s, c) => s + calcCat(c.itens), 0)
  const totalItens = categorias.reduce((s, c) => s + c.itens.length, 0)

  // Cabeçalho repetido em todas as páginas
  function drawHeader() {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(20, 20, 20)
    doc.text(titulo, M, 15)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(105, 105, 105)
    doc.text(obra.name, M, 21)

    const linha2 = [obra.client, obra.location].filter(Boolean).join('   ·   ')
    if (linha2) doc.text(linha2, M, 25.5)

    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 150)
    doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, W - M, 15, { align: 'right' })
    doc.text(mode === 'resumo' ? 'Resumo por categoria' : 'Planilha completa', W - M, 20, { align: 'right' })
  }

  const baseOpts = {
    startY: 31,
    margin: { top: 31, left: M, right: M, bottom: 14 },
    theme: 'grid' as const,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: [40, 40, 40] as [number, number, number], lineColor: [225, 225, 225] as [number, number, number], lineWidth: 0.1 },
    headStyles: { fillColor: HEAD_FILL, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const, fontSize: 8 },
    footStyles: { fillColor: FOOT_FILL, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
    showFoot: 'lastPage' as const,
    didDrawPage: drawHeader,
  }

  if (mode === 'resumo') {
    // ── Resumo: só categorias + totais ──
    const body: RowInput[] = categorias.map((c, i) => [
      String(i + 1),
      c.nome,
      String(c.itens.length),
      fmtCurrency(calcCat(c.itens)),
    ])

    autoTable(doc, {
      ...baseOpts,
      head: [['#', 'Categoria', 'Itens', 'Total']],
      body,
      foot: [['', 'TOTAL GERAL', String(totalItens), fmtCurrency(totalGeral)]],
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 38, halign: 'right' },
      },
    })
  } else {
    // ── Completa: categorias com todos os itens ──
    const body: RowInput[] = []

    categorias.forEach((cat, ci) => {
      const catTotal = calcCat(cat.itens)

      // Linha da categoria (span nas 6 primeiras colunas + total à direita)
      body.push([
        {
          content: `${ci + 1}.  ${cat.nome}`,
          colSpan: 6,
          styles: { fillColor: CAT_FILL, fontStyle: 'bold', textColor: [20, 20, 20] },
        },
        {
          content: fmtCurrency(catTotal),
          styles: { fillColor: CAT_FILL, fontStyle: 'bold', textColor: [20, 20, 20], halign: 'right' },
        },
      ])

      if (cat.itens.length === 0) {
        body.push([
          { content: 'Sem itens', colSpan: 7, styles: { textColor: [150, 150, 150], fontStyle: 'italic', halign: 'center' } },
        ])
        return
      }

      cat.itens.forEach((it, ii) => {
        body.push([
          `${ci + 1}.${ii + 1}`,
          it.codigo || '—',
          it.descricao || '',
          fmtQtd(it.quantidade),
          it.unidade || '',
          fmtCurrency(it.valor_unitario),
          fmtCurrency(it.quantidade * it.valor_unitario),
        ])
      })
    })

    autoTable(doc, {
      ...baseOpts,
      head: [['Item', 'Código', 'Descrição', 'Qtd', 'Un', 'Valor Unit.', 'Total']],
      body,
      foot: [[{ content: 'TOTAL GERAL', colSpan: 6, styles: { halign: 'right' } }, fmtCurrency(totalGeral)]],
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
      },
    })
  }

  // Nome do arquivo
  const slug = (s: string) =>
    s.normalize('NFD')
      .split('')
      .filter(ch => ch.charCodeAt(0) <= 127)
      .join('')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  const sufixo = mode === 'resumo' ? 'resumo' : 'completa'
  doc.save(`${slug(titulo)}_${slug(obra.name)}_${sufixo}.pdf`)
}
