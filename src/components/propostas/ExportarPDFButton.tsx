'use client'

import { useState } from 'react'
import { Proposta } from '@/types/proposta'

interface Props {
  proposta: Proposta
  variant?: 'button' | 'panel'
}

function diasPorExtenso(dias: number): string {
  const map: Record<number, string> = {
    7: 'sete', 10: 'dez', 14: 'quatorze', 15: 'quinze', 20: 'vinte',
    21: 'vinte e um', 30: 'trinta', 45: 'quarenta e cinco', 60: 'sessenta',
    90: 'noventa', 120: 'cento e vinte',
  }
  return map[dias] ?? String(dias)
}

async function loadImageAsBase64(path: string): Promise<string> {
  const res = await fetch(path)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function splitText(doc: any, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth)
}

export function ExportarPDFButton({ proposta, variant = 'panel' }: Props) {
  const [loading, setLoading]     = useState(false)
  const [highlight, setHighlight] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)

    try {
      const { jsPDF } = await import('jspdf')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const H = 297
      const M = 18
      const contentW = W - M * 2
      const PAGE_BOTTOM = H - 30   // margem inferior de segurança
      const PAGE_TOP    = 38       // y inicial após cabeçalho

      const [logoBranca, logoEscura] = await Promise.all([
        loadImageAsBase64('/logofundopreto.jpg'),
        loadImageAsBase64('/logofundobranco.jpg'),
      ])

      const HL = highlight ? [255, 220, 0] as [number, number, number] : null

      function highlightBg(x: number, y: number, w: number, h: number) {
        if (!HL) return
        doc.setFillColor(...HL)
        doc.rect(x, y - h + 1, w, h + 1, 'F')
      }

      // ─── Paginação dinâmica ───────────────────────────────────────────────────
      // Verifica se há espaço suficiente; se não, cria nova página e retorna y=PAGE_TOP
      function checkSpace(currentY: number, needed: number): number {
        if (currentY + needed > PAGE_BOTTOM) {
          addPageHeader()
          return PAGE_TOP
        }
        return currentY
      }

      // ─────────────────────────────────────────────────────────────
      // PÁGINA 1 — CAPA
      // ─────────────────────────────────────────────────────────────
      doc.setFillColor(0, 0, 0)
      doc.rect(0, 0, W, H, 'F')

      doc.addImage(logoBranca, 'JPEG', M, 14, 50, 50)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.text('CLIENTE:', W - M - 5, 20, { align: 'right' })
      doc.text('PROPOSTA NÚMERO:', W - M - 5, 40, { align: 'right' })
      doc.text('DATA DE EMISSÃO:', W - M - 5, 60, { align: 'right' })

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      highlightBg(M, 20, contentW * 0.7, 5)
      if (HL) doc.setTextColor(30, 30, 30)
      doc.text(proposta.dataEmissao, W - M - 5, 70, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      highlightBg(M, 75, contentW * 0.7, 5)
      if (HL) doc.setTextColor(30, 30, 30)
      doc.text(proposta.cliente, W - M - 5, 30, { align: 'right' })
      doc.setTextColor(255, 255, 255)

      const tituloLinhas = proposta.tituloCapa.split('\n').filter(Boolean)
      doc.setFontSize(10)
      if (HL) { highlightBg(M, 89, contentW * 0.8, 5); doc.setTextColor(30, 30, 30) }
      doc.setTextColor(255, 255, 255)

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      highlightBg(M, 122, 80, 10)
      if (HL) doc.setTextColor(30, 30, 30)
      doc.text(proposta.numero, W - M - 5, 50, { align: 'right' })
      doc.setTextColor(255, 255, 255)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(52)
      doc.setTextColor(255, 255, 255)
      let tyY = 160
      for (const linha of tituloLinhas) {
        doc.text(linha, M, tyY)
        tyY += 56
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(120, 120, 120)
      doc.text('21 98174-2139', W / 2, H - 26, { align: 'center' })
      doc.text('@tyronengenharia', W / 2, H - 21, { align: 'center' })
      doc.text('www.tyronengenharia.com', W / 2, H - 16, { align: 'center' })

      // ─────────────────────────────────────────────────────────────
      // Cabeçalho das páginas internas (sem número fixo)
      // ─────────────────────────────────────────────────────────────
      function addPageHeader() {
        doc.addPage()
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, W, H, 'F')
        doc.addImage(logoEscura, 'JPEG', M, 10, 18, 18)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(150, 150, 150)
        doc.text(`Proposta ${proposta.numero}`, W - M, 14, { align: 'right' })
        doc.text('WWW.TYRONENGENHARIA.COM', W / 2, H - 8, { align: 'center' })
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.line(M, 30, W - M, 30)
      }

      // Imprime título de seção e retorna o novo y
      function sectionTitle(num: string, title: string, y: number): number {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.text(`${num} ${title}`, M, y)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.line(M, y + 2, W - M, y + 2)
        return y + 10
      }

      function bodyText(
        text: string,
        x: number,
        y: number,
        maxW: number,
        opts?: { color?: [number, number, number]; size?: number }
      ): number {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(opts?.size ?? 9)
        doc.setTextColor(...(opts?.color ?? [40, 40, 40] as [number, number, number]))
        const lines = splitText(doc, text, maxW)
        doc.text(lines, x, y)
        return y + lines.length * (opts?.size ?? 9) * 0.45 + 2
      }

      // ─────────────────────────────────────────────────────────────
      // PÁGINA 2 — VISÃO GERAL + OBJETIVOS
      // ─────────────────────────────────────────────────────────────
      addPageHeader()
      let y = PAGE_TOP

      y = sectionTitle('01', 'VISÃO GERAL', y)
      const visaoGeral =
        'Esta é uma proposta que contém o esboço e o escopo do projeto de todas as etapas principais que tomaremos, marcos que definimos de antemão e o preço do projeto. Quaisquer dúvidas sobre aspectos desta proposta, entre em contato por e-mail ou através do nosso site.\n\nTodo o conteúdo desta proposta é confidencial e destinado apenas ao cliente e aos seus afiliados.'
      y = bodyText(visaoGeral, M, y, contentW)
      y += 8

      y = sectionTitle('02', 'OBJETIVOS', y)

      const halfW = contentW * 0.52
      highlightBg(M, y + 6, halfW, 6)
      if (HL) doc.setTextColor(30, 30, 30); else doc.setTextColor(40, 40, 40)
      y = bodyText(proposta.objetivo, M, y, halfW)
      doc.setTextColor(40, 40, 40)
      y += 6

      const features = [
        { label: 'ESTUDO DE CASO', desc: 'Desenvolvemos um estudo de caso específico para o seu projeto' },
        { label: 'PROJETO',        desc: 'Criamos um plano estratégico alinhado às necessidades e expectativas.' },
        { label: 'ENTREGA',        desc: 'Entregamos dentro do cronograma e com toda garantia e segurança.' },
      ]
      const cardX = M + halfW + 6
      const cardW = contentW - halfW - 6
      let cardY = 85
      for (const f of features) {
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(cardX, cardY, cardW, 22, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(30, 30, 30)
        doc.text(f.label, cardX + 4, cardY + 7)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        const descLines = splitText(doc, f.desc, cardW - 8)
        doc.text(descLines, cardX + 4, cardY + 13)
        cardY += 26
      }

      // ─────────────────────────────────────────────────────────────
      // PÁGINA 3 — DETALHAMENTO DO SERVIÇO (paginação dinâmica)
      // ─────────────────────────────────────────────────────────────
      addPageHeader()
      y = PAGE_TOP

      // Título 01 — sempre no topo desta nova página, sem necessidade de checkSpace
      y = sectionTitle('01', 'DETALHAMENTO DO SERVIÇO SOLICITADO', y)

      for (const etapa of proposta.etapas) {
        if (!etapa.trim()) continue
        const lines = splitText(doc, `• ${etapa}`, contentW - 4)
        const blockH = lines.length * 4.5 + 3

        // Garante que o bullet cabe; se não, pula de página
        y = checkSpace(y, blockH)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(40, 40, 40)
        if (HL) {
          doc.setFillColor(...HL)
          doc.rect(M, y - 4, contentW, lines.length * 4.5 + 1, 'F')
          doc.setTextColor(30, 30, 30)
        }
        doc.text(lines, M + 2, y)
        y += blockH
        doc.setTextColor(40, 40, 40)
      }
      y += 4

      // Título 02 — reserva espaço para título + pelo menos 3 linhas de conteúdo (~20mm)
      y = checkSpace(y, 30)
      y = sectionTitle('02', 'OBRIGAÇÕES DA TYRON ENGENHARIA', y)

      const obrigacoesTyron = [
        'Fornecer ART - CREA RJ',
        'Disponibilizar mão de obra qualificada, equipamentos e ferramentas necessárias à correta execução do serviço.',
        'Fornecer todos os materiais necessários à execução, incluindo cimento, areia, brita, aço para armação, fôrmas e espaçadores, salvo itens expressamente excluídos em contrato.',
        'Realizar a montagem das armações, fôrmas e concretagem conforme dimensionamento técnico previsto.',
        'Garantir o nivelamento, alinhamento e resistência estrutural conforme especificação.',
        'Zelar pela segurança do trabalho, fornecendo e exigindo o uso de EPIs.',
        'Manter o local de trabalho organizado, realizando a limpeza ao final dos serviços.',
        'Cumprir o prazo de execução acordado, salvo intercorrências técnicas, climáticas ou de força maior.',
        'Responsabilizar-se pela qualidade dos serviços e materiais empregados.',
      ]

      for (const item of obrigacoesTyron) {
        const lines = splitText(doc, `• ${item}`, contentW - 4)
        const blockH = lines.length * 4.2 + 2

        y = checkSpace(y, blockH)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 40, 40)
        doc.text(lines, M + 2, y)
        y += blockH
      }

      // ─────────────────────────────────────────────────────────────
      // OBRIGAÇÕES DA CONTRATANTE + GARANTIA (paginação dinâmica)
      // ─────────────────────────────────────────────────────────────

      // Título 03 — reserva título + 3 linhas (~30mm)
      y = checkSpace(y, 30)
      y = sectionTitle('03', 'OBRIGAÇÕES DA CONTRATANTE', y)

      const obrigacoesContratante = [
        'Disponibilizar o acesso livre e seguro ao local da obra.',
        'Garantir que o local esteja desimpedido, limpo e apto para o início dos trabalhos.',
        'Fornecer as informações, autorizações e documentos necessários à execução do serviço.',
        'Indicar um responsável para acompanhamento e validação dos serviços executados.',
        'Efetuar os pagamentos nas condições, valores e prazos estabelecidos na proposta/contrato.',
        'Comunicar previamente qualquer interferência, restrição ou condição especial no local.',
        'Responsabilizar-se pela instalação das caixas d\'água.',
        'Não intervir diretamente na execução dos serviços, salvo por meio de solicitações formais à Tyron Engenharia.',
      ]

      for (const item of obrigacoesContratante) {
        const lines = splitText(doc, `• ${item}`, contentW - 4)
        const blockH = lines.length * 4.2 + 2

        y = checkSpace(y, blockH)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 40, 40)
        doc.text(lines, M + 2, y)
        y += blockH
      }
      y += 8

      // Bloco de garantia (~50mm de altura)
      y = checkSpace(y, 50)
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(M, y, contentW, 40, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      doc.text('GARANTIA', M + 5, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      const garantiaText = 'A Tyron Engenharia garante os serviços executados pelo prazo de 05 (cinco) anos, conforme disposto no art. 618 do Código Civil Brasileiro, contados a partir da data de conclusão e entrega da obra, respondendo pela solidez e segurança estrutural.'
      const gLines = splitText(doc, garantiaText, contentW - 10)
      doc.text(gLines, M + 5, y + 15)
      y += 50

      // Bloco de cronograma (~50mm)
      y = checkSpace(y, 50)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('CRONOGRAMA', M, y)
      doc.setDrawColor(200, 200, 200)
      doc.line(M, y + 2, W - M, y + 2)
      y += 12

      doc.setFillColor(30, 30, 30)
      doc.roundedRect(M, y, contentW, 28, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text('01', M + 8, y + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(180, 180, 180)
      const prazoTexto = `O prazo estimado para a execução é de ${diasPorExtenso(proposta.prazoExecucao)} (${proposta.prazoExecucao}) dias corridos.`
      const prazoLines = splitText(doc, prazoTexto, contentW - 40)
      doc.text(prazoLines, M + 22, y + 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 220, 50)
      doc.text('DURAÇÃO DA ETAPA', W - M - 4, y + 9, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(200, 200, 200)
      doc.text(`${proposta.prazoExecucao} dias corridos`, W - M - 4, y + 16, { align: 'right' })
      y += 36

      // ─────────────────────────────────────────────────────────────
      // ENTREGÁVEIS + INVESTIMENTO (paginação dinâmica)
      // ─────────────────────────────────────────────────────────────

      y = 90
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('ENTREGÁVEIS', M, y)
      doc.setDrawColor(200, 200, 200)
      doc.line(M, y + 2, W - M, y + 2)
      y += 12

      for (const e of proposta.entregaveis) {
        if (!e.trim()) continue
        const blockH = 13

        y = checkSpace(y, blockH)

        doc.setFillColor(240, 240, 240)
        doc.roundedRect(M, y, contentW, 10, 2, 2, 'F')
        if (HL) {
          doc.setFillColor(...HL)
          doc.roundedRect(M, y, contentW, 10, 2, 2, 'F')
        }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(30, 30, 30)
        doc.text(`• ${e}`, M + 4, y + 6.5)
        y += blockH
      }
      y += 8

      // Bloco de investimento (~60mm)
      y = checkSpace(y, 40)
      doc.setFillColor(20, 20, 20)
      doc.roundedRect(M, y, contentW, 52, 3, 3, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      const investTexto = `O investimento total para a execução dos serviços descritos nesta proposta é de R$ ${proposta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${proposta.valorExtenso}).`
      const scopeTexto = proposta.escopaMaterial === 'mao_de_obra_e_materiais'
        ? 'Este valor contempla fornecimento de materiais, mão de obra, equipamentos e execução conforme escopo e entregáveis acordados.'
        : 'Este valor contempla exclusivamente a mão de obra e execução, conforme escopo e entregáveis acordados.'
      const invLines = splitText(doc, investTexto + ' ' + scopeTexto, contentW - 10)
      doc.text(invLines, M + 5, y + 10)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text('Total do Investimento:', M + 5, y + 20)      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(255, 220, 50)
      highlightBg(M + 5, y + 52, contentW - 10, 8)
      if (HL) doc.setTextColor(30, 30, 30)
      doc.text(`R$ ${proposta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, y + 40, { align: 'center' })
      doc.setTextColor(255, 255, 255)
      y += 60

      // ─────────────────────────────────────────────────────────────
      // PAGAMENTO + ASSINATURA (paginação dinâmica)
      // ─────────────────────────────────────────────────────────────

      // Título 04 — reserva título + 3 linhas
      y = checkSpace(y, 30)
      y = sectionTitle('04', 'FORMA DE PAGAMENTO', y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(60, 60, 60)

      y = checkSpace(y, 10)
      doc.text('4.1. A mobilização será executada após o De acordo da proposta.', M, y)
      y += 7

      const cond42Lines = splitText(doc, proposta.condicoesPagamento, contentW - 10)
      const cond42H = cond42Lines.length * 4.5 + 5

      y = checkSpace(y, cond42H)
      doc.text('4.2. ', M, y)
      if (HL) {
        doc.setFillColor(...HL)
        doc.rect(M + 8, y - 4, contentW - 8, cond42Lines.length * 4.5 + 1, 'F')
        doc.setTextColor(30, 30, 30)
      }
      doc.text(cond42Lines, M + 8, y)
      y += cond42H
      doc.setTextColor(60, 60, 60)

      const item43Lines = splitText(doc,
        '4.3. No caso de atraso, cobra-se multa de 2% (dois por cento) sobre o valor da nota fiscal, mais juros de 1% (um por cento) ao mês.',
        contentW
      )
      y = checkSpace(y, item43Lines.length * 4.5 + 12)
      doc.text(item43Lines, M, y, { maxWidth: contentW })
      y += item43Lines.length * 4.5 + 12

      // Caixa NF + CNPJ (~30mm)
      y = checkSpace(y, 30)
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(M, y, contentW, 22, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      doc.text('a) TYRON ENGENHARIA LTDA', M + 4, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('CNPJ: 40.738.112/0001-69 — NOTA FISCAL', M + 4, y + 13)
      if (proposta.descricaoNF) {
        if (HL) { doc.setFillColor(...HL); doc.rect(M + 4, y + 15, contentW - 8, 5, 'F'); doc.setTextColor(30, 30, 30) }
        doc.text(proposta.descricaoNF, M + 4, y + 19, { maxWidth: contentW - 8 })
      }
      y += 30

      // Título 05 — reserva título + 3 linhas
      y = checkSpace(y, 30)
      y = sectionTitle('05', 'EXECUÇÃO DOS SERVIÇOS', y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(60, 60, 60)

      y = checkSpace(y, 10)
      doc.text(`5.1. A proposta tem validade de ${diasPorExtenso(proposta.validade)} (${proposta.validade}) dias a partir da atual data.`, M, y, { maxWidth: contentW })
      y += 7

      y = checkSpace(y, 10)
      doc.text('5.2. Início dos serviços quando liberado pelo contratante.', M, y)
      y += 10

      y = checkSpace(y, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      doc.text('SOMENTE APÓS A ASSINATURA E ENVIO DO "DE ACORDO" INICIARÃO-SE OS SERVIÇOS.', M, y, { maxWidth: contentW })
      y += 16

      // Assinatura do engenheiro (~25mm)
      y = checkSpace(y, 25)
      doc.setDrawColor(30, 30, 30)
      doc.setLineWidth(0.4)
      doc.line(M, y, M + 75, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      doc.text(`ENGENHEIRO ${proposta.responsavel.toUpperCase()}`, M, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(80, 80, 80)
      doc.text(proposta.crea, M, y + 10)
      doc.text('TYRON ENGENHARIA - 40.738.112/0001-69', M, y + 15)
      y += 22

      // Bloco contratante (~50mm)
      y = checkSpace(y, 50)
      doc.setFillColor(248, 248, 248)
      doc.roundedRect(M, y, contentW, 42, 3, 3, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(M, y, contentW, 42, 3, 3, 'S')

      const fieldX = M + 5
      const fieldY = y + 8
      const lineW = (contentW - 20) / 2

      const fields = ['Nome Legível:', 'Cargo:', 'Razão Social:', 'CNPJ/CPF:']
      for (let i = 0; i < fields.length; i++) {
        const col = i % 2
        const row = Math.floor(i / 2)
        const fx = fieldX + col * (lineW + 10)
        const fy = fieldY + row * 14
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text(fields[i], fx, fy)
        doc.setDrawColor(180, 180, 180)
        doc.line(fx, fy + 5, fx + lineW, fy + 5)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(60, 60, 60)
      doc.text('ASSINATURA DO CONTRATANTE', W / 2, y + 34, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(120, 120, 120)
      doc.text(`"De acordo" — Referente a esta proposta nº ${proposta.numero}`, W / 2, y + 38, { align: 'center' })



      // ── Salva ──
      doc.save(`Proposta_${proposta.numero}_${proposta.cliente.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)

    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Erro ao gerar PDF')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (variant === 'button') {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
      >
        {loading ? <><Spinner />Gerando...</> : <>↗ Exportar PDF</>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          role="switch"
          aria-checked={highlight}
          onClick={() => setHighlight(h => !h)}
          className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${highlight ? 'bg-amber-500' : 'bg-zinc-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${highlight ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
        <div>
          <p className="text-xs font-medium text-zinc-300 leading-none">Destacar campos editáveis</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Marca-texto amarelo nos campos variáveis</p>
        </div>
      </label>

      {highlight && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-950/40 border border-amber-800/40 rounded-lg">
          <span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
          <p className="text-[11px] text-amber-400">Cliente, obra, etapas, valor, prazo e condições em destaque</p>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
      >
        {loading ? <><Spinner />Gerando PDF...</> : <>↗ Exportar PDF</>}
      </button>

      {error && <p className="text-[11px] text-red-400 px-1">{error}</p>}
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
}