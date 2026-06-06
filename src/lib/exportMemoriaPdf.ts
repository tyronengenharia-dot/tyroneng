import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'

type ObraInfo = { name: string; client?: string | null; location?: string | null }

export type MemoriaPdfLinha = {
  descricao: string
  formula: string | null
  quantidade: number
}

export type MemoriaPdfItem = {
  codigo: string | null
  descricao: string | null
  unidade: string | null
  quantidadePlanilha: number
  linhas: MemoriaPdfLinha[]
}

export type MemoriaPdfCategoria = {
  nome: string
  itens: MemoriaPdfItem[]
}

const fmtQtd = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
const bateQtd = (a: number, b: number) => Math.abs(a - b) < 0.0001

// Paleta print-friendly (fundo claro, texto escuro)
const HEAD_FILL: [number, number, number] = [24, 24, 24]
const CAT_FILL: [number, number, number]  = [232, 232, 232]
const ITEM_FILL: [number, number, number] = [244, 244, 244]
const OK_TXT: [number, number, number]    = [21, 128, 61]
const WARN_TXT: [number, number, number]  = [180, 83, 9]
const MUTED_TXT: [number, number, number] = [150, 150, 150]

export function exportMemoriaPdf(opts: {
  obra: ObraInfo
  planilhaLabel: string
  categorias: MemoriaPdfCategoria[]
}) {
  const { obra, planilhaLabel, categorias } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const M = 14
  const titulo = 'Memória de Cálculo'

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
    doc.text(`Planilha: ${planilhaLabel}`, W - M, 20, { align: 'right' })
  }

  const body: RowInput[] = []

  categorias.forEach((cat, ci) => {
    // Linha da categoria
    body.push([
      {
        content: `${ci + 1}.  ${cat.nome}`,
        colSpan: 3,
        styles: { fillColor: CAT_FILL, fontStyle: 'bold', textColor: [20, 20, 20] },
      },
    ])

    cat.itens.forEach((it, ii) => {
      const total = it.linhas.reduce((s, l) => s + (l.quantidade || 0), 0)
      const temLinhas = it.linhas.length > 0
      const bate = temLinhas && bateQtd(total, it.quantidadePlanilha)
      const un = it.unidade || ''

      const tituloItem = [`${ci + 1}.${ii + 1}`, it.codigo, it.descricao || 'Sem descrição']
        .filter(Boolean)
        .join('   ')

      // Cabeçalho do item (vermelho-âmbar quando diverge, para varredura rápida)
      const itemTxt: [number, number, number] =
        temLinhas && !bate ? WARN_TXT : [25, 25, 25]
      body.push([
        {
          content: tituloItem,
          colSpan: 3,
          styles: { fillColor: ITEM_FILL, fontStyle: 'bold', textColor: itemTxt },
        },
      ])

      if (!temLinhas) {
        body.push([
          {
            content: `Sem linhas de memória  ·  Planilha: ${fmtQtd(it.quantidadePlanilha)} ${un}`.trim(),
            colSpan: 3,
            styles: { fontStyle: 'italic', textColor: MUTED_TXT, halign: 'center' },
          },
        ])
        return
      }

      it.linhas.forEach(l => {
        body.push([
          l.descricao || '—',
          l.formula || '',
          fmtQtd(l.quantidade),
        ])
      })

      // Total da memória vs. planilha
      body.push([
        {
          content: `Planilha: ${fmtQtd(it.quantidadePlanilha)} ${un}`.trim(),
          styles: { textColor: MUTED_TXT },
        },
        { content: 'Total da memória', styles: { halign: 'right', fontStyle: 'bold' } },
        {
          content: `${fmtQtd(total)}${bate ? '' : '  ≠'}`,
          styles: { halign: 'right', fontStyle: 'bold', textColor: bate ? OK_TXT : WARN_TXT },
        },
      ])
    })
  })

  autoTable(doc, {
    startY: 31,
    margin: { top: 31, left: M, right: M, bottom: 14 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: HEAD_FILL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    head: [['Descrição', 'Fórmula', 'Quantidade']],
    body,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 44 },
      2: { cellWidth: 34, halign: 'right' },
    },
    didDrawPage: drawHeader,
  })

  // Nome do arquivo
  const slug = (s: string) =>
    s.normalize('NFD')
      .split('')
      .filter(ch => ch.charCodeAt(0) <= 127)
      .join('')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  doc.save(`Memoria_de_Calculo_${slug(obra.name)}_${slug(planilhaLabel)}.pdf`)
}
