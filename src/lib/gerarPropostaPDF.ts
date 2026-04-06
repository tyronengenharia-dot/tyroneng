/**
 * Tyron Engenharia — Gerador de Proposta PDF
 * 100% TypeScript · Vercel-ready · pdf-lib only
 *
 * npm install pdf-lib @pdf-lib/fontkit
 *
 * MAPEAMENTO DE CAMPOS (campo → página/posição):
 *  numero        → capa (canto dir), rodapé todas as páginas
 *  cliente       → capa (título grande)
 *  tituloCapa    → capa (título enorme central)
 *  dataEmissao   → capa (abaixo do título)
 *  objetivo      → pág 1 (coluna esquerda objetivos)
 *  etapas[]      → pág 2 (bullets detalhamento)
 *  prazoExecucao → pág 4 (cronograma)
 *  entregaveis[] → pág 5 (bullets entregáveis)
 *  valor         → pág 5 (grande direita + parágrafo)
 *  valorExtenso  → pág 5 (parágrafo investimento)
 *  escopaMaterial→ pág 5 (parágrafo "contempla...")
 *  condicoesPagamento → pág 6 (item 4.2)
 *  validade      → pág 6 (item 5.1)
 *  descricaoNF   → pág 6 (linha NF)
 *  responsavel   → pág 6 (bloco engenheiro)
 *  crea          → pág 6 (bloco engenheiro)
 */

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { Proposta, EscopaMaterial } from '@/types/proposta'

// ── Layout A4 em pontos ───────────────────────────────────────────────────────
const W  = 595.28
const H  = 841.89
const ML = 42          // margin left
const MR = 42          // margin right
const MT = 52          // margin top
const MB = 38          // margin bottom
const CW = W - ML - MR // content width = 511.28

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  black:   rgb(0.04, 0.04, 0.05),
  white:   rgb(1, 1, 1),
  g1:      rgb(0.50, 0.50, 0.50),   // número de seção / rodapé
  g2:      rgb(0.40, 0.40, 0.40),   // corpo de texto principal
  g3:      rgb(0.75, 0.75, 0.75),   // linhas divisórias
  g4:      rgb(0.28, 0.28, 0.28),   // dots capa
  hl:      rgb(0.965, 0.784, 0.10), // #F6C819 — marca-texto
  hlDark:  rgb(0.10, 0.07, 0.00),   // texto sobre marca-texto
}

// ── Interfaces internas ───────────────────────────────────────────────────────
interface F { reg: PDFFont; bold: PDFFont }
interface Ctx { page: PDFPage; f: F; hl: boolean }

// ── Utilitários de texto ──────────────────────────────────────────────────────

/** Quebra texto em linhas que cabem em maxWidth pontos */
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  if (!text) return ['']
  const lines: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(' ')
    let cur = ''
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (font.widthOfTextAtSize(test, size) <= maxW) {
        cur = test
      } else {
        if (cur) lines.push(cur)
        // se palavra sozinha for maior que maxW, aceita assim mesmo
        cur = w
      }
    }
    lines.push(cur)
  }
  return lines.length ? lines : ['']
}

/**
 * Desenha texto com quebra automática.
 * Retorna o y após o último caractere desenhado.
 */
function txt(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number
    font?: PDFFont
    color?: ReturnType<typeof rgb>
    maxW?: number
    lh?: number          // line height
  } = {}
): number {
  const { size = 9.5, font, color = C.g2, maxW = CW, lh = 14 } = opts
  const f = font ?? ctx.f.reg
  for (const para of text.split('\n')) {
    if (!para.trim()) { y -= lh * 0.5; continue }
    for (const line of wrap(para, f, size, maxW)) {
      ctx.page.drawText(line, { x, y, size, font: f, color })
      y -= lh
    }
  }
  return y
}

/**
 * Campo editável: desenha highlight amarelo se ctx.hl=true,
 * depois o texto. Retorna y abaixo do bloco.
 */
function field(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  maxW: number,
  opts: {
    size?: number
    font?: PDFFont
    color?: ReturnType<typeof rgb>
    lh?: number
    padX?: number
    padY?: number
    align?: 'left' | 'right' | 'center'
  } = {}
): number {
  const {
    size = 10, font, color = C.black,
    lh = size * 1.45, padX = 4, padY = 3,
    align = 'left',
  } = opts
  const f = font ?? ctx.f.bold
  const lines = wrap(value, f, size, maxW)
  const blockH = lines.length * lh + padY * 2

  if (ctx.hl) {
    ctx.page.drawRectangle({
      x: x - padX,
      y: y - blockH + lh - padY,
      width: maxW + padX * 2,
      height: blockH,
      color: C.hl,
      borderColor: rgb(0.82, 0.65, 0.05),
      borderWidth: 0.4,
    })
  }

  const col = ctx.hl ? C.hlDark : color
  for (const line of lines) {
    const tw = f.widthOfTextAtSize(line, size)
    let tx = x
    if (align === 'right')  tx = x + maxW - tw
    if (align === 'center') tx = x + (maxW - tw) / 2
    ctx.page.drawText(line, { x: tx, y, size, font: f, color: col })
    y -= lh
  }
  return y
}

/** Linha horizontal */
function hline(ctx: Ctx, x1: number, y: number, x2: number, color = C.g3, w = 0.5) {
  ctx.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color, thickness: w })
}

/** Grid de pontos decorativos */
function dots(ctx: Ctx, x0: number, y0: number, cols: number, rows: number, sp = 8) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      ctx.page.drawCircle({ x: x0 + c * sp, y: y0 - r * sp, size: 1.1, color: C.g4, opacity: 0.55 })
}

/** "01" acinzentado antes do título de seção */
function secNum(ctx: Ctx, n: string, x: number, y: number) {
  ctx.page.drawText(n, { x, y, size: 11, font: ctx.f.reg, color: C.g1 })
}

/** Rodapé: "Proposta 345.970" alinhado à direita */
function footerNum(ctx: Ctx, numero: string) {
  const t = `Proposta ${numero}`
  const tw = ctx.f.reg.widthOfTextAtSize(t, 8)
  ctx.page.drawText(t, { x: W - MR - tw, y: MB - 8, size: 8, font: ctx.f.reg, color: C.g1 })
}

/** Rodapé: "WWW.TYRONENGENHARIA.COM" centralizado */
function footerSite(ctx: Ctx) {
  const t = 'WWW.TYRONENGENHARIA.COM'
  const tw = ctx.f.reg.widthOfTextAtSize(t, 7)
  ctx.page.drawText(t, { x: (W - tw) / 2, y: MB - 18, size: 7, font: ctx.f.reg, color: C.g1 })
}

// ── Formatação de valores ─────────────────────────────────────────────────────

function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const EXTENSOS: Record<number, string> = {
  7: 'sete', 10: 'dez', 14: 'quatorze', 15: 'quinze', 20: 'vinte',
  25: 'vinte e cinco', 30: 'trinta', 45: 'quarenta e cinco',
  60: 'sessenta', 90: 'noventa', 120: 'cento e vinte',
}
function diasExtenso(n: number): string { return EXTENSOS[n] ?? String(n) }

function escopaTexto(e: EscopaMaterial): string {
  return e === 'mao_de_obra'
    ? 'mão de obra especializada e gestão de execução'
    : 'fornecimento de materiais, mão de obra, equipamentos e execução completa dos serviços'
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA CAPA
// ═══════════════════════════════════════════════════════════════════════════════
function drawCapa(ctx: Ctx, p: Proposta) {
  const { page, f } = ctx

  // Fundo preto total
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.black })

  // ── Logo guindaste (vetorial) — canto superior esquerdo ──
  const lx = ML, ly = H - MT

  // Mastro vertical
  page.drawLine({ start: { x: lx + 26, y: ly - 78 }, end: { x: lx + 26, y: ly + 4 }, color: C.white, thickness: 2.8 })
  // Lança horizontal principal
  page.drawLine({ start: { x: lx + 2, y: ly }, end: { x: lx + 98, y: ly }, color: C.white, thickness: 2.4 })
  // Contra-lança (esquerda)
  page.drawLine({ start: { x: lx + 2, y: ly }, end: { x: lx + 26, y: ly - 22 }, color: C.white, thickness: 1.4 })
  // Lança principal (direita)
  page.drawLine({ start: { x: lx + 26, y: ly }, end: { x: lx + 98, y: ly - 18 }, color: C.white, thickness: 1.4 })
  // Cabo do gancho
  page.drawLine({ start: { x: lx + 78, y: ly - 14 }, end: { x: lx + 78, y: ly - 44 }, color: C.white, thickness: 1.3 })
  // Gancho (círculo)
  page.drawCircle({ x: lx + 78, y: ly - 48, size: 4.5, borderColor: C.white, borderWidth: 1.3 })
  // Base horizontal
  page.drawLine({ start: { x: lx + 10, y: ly - 78 }, end: { x: lx + 44, y: ly - 78 }, color: C.white, thickness: 2 })
  // Treliça interna (mastro)
  for (let i = 0; i < 3; i++) {
    page.drawLine({ start: { x: lx + 18, y: ly - 20 - i * 18 }, end: { x: lx + 34, y: ly - 30 - i * 18 }, color: C.white, thickness: 0.7 })
    page.drawLine({ start: { x: lx + 34, y: ly - 20 - i * 18 }, end: { x: lx + 18, y: ly - 30 - i * 18 }, color: C.white, thickness: 0.7 })
  }
  // Letras TYRON
  page.drawText('T', { x: lx + 20, y: ly - 94, size: 22, font: f.bold, color: C.white })
  page.drawText('Y R', { x: lx + 5,  y: ly - 110, size: 10, font: f.reg, color: C.g1 })
  page.drawText('N',   { x: lx + 34, y: ly - 110, size: 10, font: f.reg, color: C.g1 })

  // ── Info no canto superior direito ──
  // (removido bloco "PROJECT NAME" pequeno conforme solicitado)
  let iy = H - MT - 10

  // CLIENTE: (label)
  const lbCliente = 'CLIENTE:'
  const lbW = f.reg.widthOfTextAtSize(lbCliente, 7)
  page.drawText(lbCliente, { x: W - MR - lbW, y: iy, size: 7, font: f.reg, color: C.g1 })
  iy -= 16

  // Nome do cliente (editável)
  field(ctx, p.cliente, W - MR - 200, iy, 200, {
    size: 11, font: f.bold, color: C.white, align: 'right', lh: 14, padX: 3, padY: 2,
  })
  iy -= 16 * Math.max(1, wrap(p.cliente, f.bold, 11, 200).length)

  iy -= 18
  // PROPOSTA NÚMERO (label)
  const lbNum = 'PROPOSTA NÚMERO'
  page.drawText(lbNum, {
    x: W - MR - f.reg.widthOfTextAtSize(lbNum, 7),
    y: iy, size: 7, font: f.reg, color: C.g1,
  })
  iy -= 22

  // Número da proposta (editável)
  field(ctx, p.numero, W - MR - 200, iy, 200, {
    size: 20, font: f.bold, color: C.white, align: 'right', padX: 3, padY: 2,
  })

  // ── Grids decorativos de pontos ──
  dots(ctx, W - MR - 88,  H - MT - 120, 12, 20)
  dots(ctx, ML,           H / 2 - 75,   20, 18)

  // ── Título enorme central-esquerdo ──
  const titleLines = p.tituloCapa.split('\n')
  let ty = H / 2 + 50 + (titleLines.length - 1) * 20
  for (const line of titleLines) {
    page.drawText(line, { x: ML, y: ty, size: 38, font: f.bold, color: C.white })
    ty -= 46
  }

  // Data (editável)
  field(ctx, p.dataEmissao, ML, ty - 8, 280, {
    size: 11, font: f.reg, color: C.g1, padX: 3, padY: 2,
  })

  // ── Rodapé da capa ──
  page.drawText('21 98174-2139', { x: ML, y: MB, size: 8, font: f.reg, color: C.g1 })
  const ig1 = '@tyronengenharia'
  const ig2 = 'www.tyronengenharia.com'
  page.drawText(ig1, { x: W - MR - f.reg.widthOfTextAtSize(ig1, 8), y: MB + 10, size: 8, font: f.reg, color: C.g1 })
  page.drawText(ig2, { x: W - MR - f.reg.widthOfTextAtSize(ig2, 8), y: MB,      size: 8, font: f.reg, color: C.g1 })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 1 — VISÃO GERAL + OBJETIVOS
// ═══════════════════════════════════════════════════════════════════════════════
function drawVisaoGeral(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // ── 01 VISÃO GERAL ──
  secNum(ctx, '01', ML, y)
  ctx.page.drawText('VISÃO GERAL', { x: ML + 28, y, size: 22, font: f.bold, color: C.black })
  y -= 36

  const visao = 'Esta é uma proposta que contém o esboço e o escopo do projeto — de todas as etapas ' +
    'principais que tomaremos, marcos que definimos de antemão e o preço do projeto. ' +
    'Quaisquer dúvidas sobre aspectos desta proposta, entre em contato por e-mail ou através do nosso site.\n\n' +
    'Todo o conteúdo desta proposta é confidencial e destinado apenas ao cliente e aos seus ' +
    'afiliados. Caso esteja recebendo esta proposta como terceiro por acidente, informe-nos!'
  y = txt(ctx, visao, ML, y, { size: 9.5, maxW: CW, lh: 15 })
  y -= 36

  // ── 02 OBJETIVOS ──
  secNum(ctx, '02', ML, y)
  ctx.page.drawText('OBJETIVOS', { x: ML + 28, y, size: 22, font: f.bold, color: C.black })
  hline(ctx, ML + 160, y - 4, W - MR)
  y -= 30

  const colW = CW * 0.50
  const rX   = ML + colW + 16
  const rW   = CW - colW - 16

  // Coluna esquerda — OBJETIVO (editável)
  field(ctx, p.objetivo, ML, y, colW, {
    size: 9.5, font: f.reg, color: C.g2, lh: 14, padX: 3, padY: 3,
  })

  // Coluna direita — blocos fixos
  let ry = y
  const blocks = [
    { t: 'ESTUDO DE CASO', b: 'Desenvolvemos um estudo de caso específico para o seu projeto.' },
    { t: 'PROJETO',        b: 'Criamos um plano estratégico alinhado às necessidades e expectativas.' },
    { t: 'ENTREGA',        b: 'Entregamos dentro do cronograma e com toda garantia e segurança nas operações.' },
  ]
  for (const blk of blocks) {
    ctx.page.drawText(blk.t, { x: rX, y: ry, size: 8, font: f.bold, color: C.black })
    ry -= 4
    hline(ctx, rX, ry, rX + rW, rgb(0.82, 0.82, 0.82), 0.3)
    ry -= 14
    ry = txt(ctx, blk.b, rX, ry, { size: 9, maxW: rW, lh: 13 })
    ry -= 14
  }

  footerNum(ctx, p.numero)
  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — DETALHAMENTO + OBRIGAÇÕES TYRON
// ═══════════════════════════════════════════════════════════════════════════════
function drawDetalhamento(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // ── 01 DETALHAMENTO DO SERVIÇO SOLICITADO ──
  secNum(ctx, '01', ML, y)
  ctx.page.drawText('DETALHAMENTO DO SERVIÇO SOLICITADO', {
    x: ML + 28, y, size: 13, font: f.bold, color: C.black,
  })
  y -= 28

  // Etapas — EDITÁVEL (highlight em bloco)
  const etapasMapped = p.etapas.length > 0 ? p.etapas : ['(nenhuma etapa informada)']

  if (ctx.hl) {
    // Calcula altura total do bloco de etapas para o highlight
    let hTotal = 0
    for (const e of etapasMapped)
      hTotal += wrap(e, f.reg, 9.5, CW - 18).length * 14 + 6
    ctx.page.drawRectangle({
      x: ML - 4, y: y - hTotal + 10,
      width: CW + 8, height: hTotal + 4,
      color: C.hl, borderColor: rgb(0.82, 0.65, 0.05), borderWidth: 0.4,
    })
  }

  for (const etapa of etapasMapped) {
    if (y < MB + 130) break
    const col = ctx.hl ? C.hlDark : C.g2
    ctx.page.drawText('•', { x: ML + 6, y, size: 9.5, font: f.reg, color: col })
    const lines = wrap(etapa, f.reg, 9.5, CW - 18)
    for (const ln of lines) {
      ctx.page.drawText(ln, { x: ML + 18, y, size: 9.5, font: f.reg, color: col })
      y -= 14
    }
    y -= 6
  }

  y -= 18

  // ── 02 OBRIGAÇÕES DA TYRON ENGENHARIA (texto fixo) ──
  secNum(ctx, '02', ML, y)
  ctx.page.drawText('OBRIGAÇÕES DA TYRON ENGENHARIA', {
    x: ML + 28, y, size: 13, font: f.bold, color: C.black,
  })
  y -= 26

  const obrigTyron = [
    'Fornecer ART - CREA RJ',
    'Disponibilizar mão de obra qualificada, equipamentos e ferramentas necessárias à correta execução do serviço.',
    'Fornecer todos os materiais necessários à execução das bases de concreto armado, incluindo, mas não se limitando a: cimento, areia, brita, aço para armação, fôrmas, espaçadores e insumos correlatos, salvo itens expressamente excluídos em contrato.',
    'Realizar a montagem das armações, fôrmas e concretagem conforme dimensionamento técnico previsto.',
    'Garantir o nivelamento, alinhamento e resistência estrutural das bases de concreto armado para suporte das estruturas contratadas.',
  ]
  for (const item of obrigTyron) {
    if (y < MB + 28) break
    ctx.page.drawText('•', { x: ML + 6, y, size: 9.5, font: f.reg, color: C.g2 })
    y = txt(ctx, item, ML + 18, y, { size: 9.5, maxW: CW - 18, lh: 14 })
    y -= 6
  }

  footerNum(ctx, p.numero)
  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — OBRIGAÇÕES CONTRATANTE (texto fixo)
// ═══════════════════════════════════════════════════════════════════════════════
function drawObrigacoesContratante(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // Continuação das obrigações Tyron que transbordam da pág anterior
  const obrigTyronExtra = [
    'Zelar pela segurança do trabalho, fornecendo e exigindo o uso de EPIs e adotando medidas preventivas durante a execução.',
    'Manter o local de trabalho organizado, realizando a limpeza ao final dos serviços.',
    'Cumprir o prazo de execução acordado, salvo intercorrências técnicas, climáticas ou de força maior devidamente justificadas.',
    'Responsabilizar-se pela qualidade dos serviços e materiais empregados, realizando correções necessárias dentro do escopo contratado.',
  ]
  for (const item of obrigTyronExtra) {
    ctx.page.drawText('•', { x: ML + 6, y, size: 9.5, font: f.reg, color: C.g2 })
    y = txt(ctx, item, ML + 18, y, { size: 9.5, maxW: CW - 18, lh: 14 })
    y -= 6
  }

  y -= 22

  // ── 03 OBRIGAÇÕES DA CONTRATANTE ──
  secNum(ctx, '03', ML, y)
  ctx.page.drawText('OBRIGAÇÕES DA CONTRATANTE', {
    x: ML + 28, y, size: 13, font: f.bold, color: C.black,
  })
  y -= 26

  const obrigCont = [
    'Disponibilizar o acesso livre e seguro ao local da obra, permitindo a execução dos serviços nos prazos acordados.',
    'Garantir que o local esteja desimpedido, limpo e apto para o início dos trabalhos, salvo serviços previamente contratados à parte.',
    'Fornecer as informações, autorizações e documentos necessários à execução do serviço, quando aplicável.',
    'Indicar um responsável para acompanhamento e validação dos serviços executados.',
    'Efetuar os pagamentos nas condições, valores e prazos estabelecidos na proposta/contrato.',
    'Comunicar previamente qualquer interferência, restrição ou condição especial existente no local que possa impactar a execução dos serviços.',
    'Responsabilizar-se pela instalação das caixas d\'água.',
    'Não intervir diretamente na execução dos serviços, salvo por meio de solicitações formais à Tyron Engenharia.',
  ]
  for (const item of obrigCont) {
    if (y < MB + 28) break
    ctx.page.drawText('•', { x: ML + 6, y, size: 9.5, font: f.reg, color: C.g2 })
    y = txt(ctx, item, ML + 18, y, { size: 9.5, maxW: CW - 18, lh: 14 })
    y -= 6
  }

  footerNum(ctx, p.numero)
  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — GARANTIA + CRONOGRAMA
// ═══════════════════════════════════════════════════════════════════════════════
function drawGarantia(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // ── GARANTIA ──
  ctx.page.drawText('GARANTIA', { x: ML, y, size: 26, font: f.bold, color: C.black })
  hline(ctx, ML, y - 6, W - MR)
  y -= 34

  const garantia =
    'A Tyron Engenharia garante os serviços executados pelo prazo de 05 (cinco) anos, conforme ' +
    'disposto no art. 618 do Código Civil Brasileiro, contados a partir da data de conclusão e ' +
    'entrega da obra, respondendo pela solidez e segurança estrutural das bases de concreto ' +
    'armado executadas.\n\n' +
    'A garantia cobre eventuais vícios ou falhas construtivas decorrentes de erro de execução ' +
    'ou materiais fornecidos pela contratada, desde que comprovados tecnicamente.\n\n' +
    'A garantia não cobre danos decorrentes de:\n' +
    '• Uso inadequado ou sobrecarga das bases;\n' +
    '• Instalação incorreta por terceiros;\n' +
    '• Alterações, intervenções ou reformas realizadas por terceiros sem autorização da Tyron Engenharia;\n' +
    '• Ações da natureza, sinistros, recalques do solo não previstos ou fatores externos fora do controle da contratada.\n\n' +
    'Caso seja identificado algum problema coberto pela garantia, a Tyron Engenharia compromete-se ' +
    'a realizar os reparos necessários, sem ônus adicional, dentro de prazo tecnicamente razoável.'
  y = txt(ctx, garantia, ML, y, { size: 9.5, maxW: CW, lh: 14.5 })
  y -= 38

  // ── CRONOGRAMA ──
  ctx.page.drawText('CRONOGRAMA', { x: ML, y, size: 26, font: f.bold, color: C.black })
  hline(ctx, ML, y - 6, W - MR)
  y -= 40

  // Bloco "01" preto + texto — PRAZO é editável
  const bSz = 32
  ctx.page.drawRectangle({ x: ML, y: y - bSz + 12, width: bSz, height: bSz, color: C.black })
  ctx.page.drawText('01', { x: ML + 7, y: y - bSz + 18, size: 14, font: f.bold, color: C.white })

  const prazo    = p.prazoExecucao
  const prazoExt = diasExtenso(prazo)
  const cronText =
    `O prazo estimado para a execução dos serviços descritos nesta proposta é de ${prazo} (${prazoExt}) dias corridos.`

  const tX = ML + bSz + 14
  y = txt(ctx, cronText, tX, y - 2, { size: 9.5, maxW: CW - bSz - 14, lh: 14 })
  y -= 16

  // "DURAÇÃO DA ETAPA" label
  ctx.page.drawText('DURAÇÃO DA ETAPA', { x: tX, y, size: 8, font: f.reg, color: C.g1 })
  y -= 16

  // Prazo em destaque — EDITÁVEL
  field(ctx, `${prazo} dias corridos`, tX, y, 180, {
    size: 12, font: f.bold, color: C.black, lh: 16, padX: 4, padY: 3,
  })

  footerNum(ctx, p.numero)
  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — ENTREGÁVEIS + INVESTIMENTO
// ═══════════════════════════════════════════════════════════════════════════════
function drawInvestimento(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // Mini logo canto sup direito
  ctx.page.drawText('T', { x: W - MR - 18, y, size: 18, font: f.bold, color: C.black })
  ctx.page.drawText('Y R  N', { x: W - MR - 42, y: y - 13, size: 9, font: f.reg, color: C.g1 })

  y -= 38

  // ── ENTREGÁVEIS ──
  ctx.page.drawText('ENTREGÁVEIS', { x: ML, y, size: 26, font: f.bold, color: C.black })
  hline(ctx, ML, y - 6, W - MR)
  y -= 30

  // Entregáveis — EDITÁVEL
  if (ctx.hl) {
    const bH = p.entregaveis.length * 26 + 10
    ctx.page.drawRectangle({
      x: ML - 4, y: y - bH + 12,
      width: CW * 0.72, height: bH,
      color: C.hl, borderColor: rgb(0.82, 0.65, 0.05), borderWidth: 0.4,
    })
  }
  for (const item of p.entregaveis) {
    const col = ctx.hl ? C.hlDark : C.black
    ctx.page.drawText('•  ' + item, { x: ML + 4, y, size: 10, font: f.bold, color: col })
    y -= 26
  }
  y -= 22

  // ── INVESTIMENTO ──
  ctx.page.drawText('INVESTIMENTO', { x: ML, y, size: 26, font: f.bold, color: C.black })
  hline(ctx, ML, y - 6, W - MR)
  y -= 30

  // Valor formatado
  const valorFmt = brl(p.valor)
  const extDesc  = p.valorExtenso
    ? `${valorFmt} (${p.valorExtenso})`
    : valorFmt
  const escopaDesc = escopaTexto(p.escopaMaterial)

  const investPara =
    `O investimento total para a execução dos serviços descritos nesta proposta é de ${extDesc}.\n\n` +
    `Este valor contempla ${escopaDesc}, bem como todos os itens previstos no escopo e entregáveis acordados.`

  // Coluna esquerda — parágrafo (editável)
  const leftW = CW * 0.60
  if (ctx.hl) {
    const linhas = wrap(investPara.replace('\n\n', ' '), f.reg, 9.5, leftW)
    const bH = linhas.length * 14 + 16
    ctx.page.drawRectangle({
      x: ML - 3, y: y - bH + 12,
      width: leftW + 6, height: bH,
      color: rgb(1, 0.99, 0.88),
      borderColor: rgb(0.82, 0.65, 0.05), borderWidth: 0.3,
    })
  }

  const yParaBefore = y
  y = txt(ctx, investPara, ML, y - 2, { size: 9.5, maxW: leftW, lh: 14 })

  // Bloco "Total do Investimento" — direita — EDITÁVEL
  const rX = ML + CW * 0.65
  let ry = yParaBefore

  ctx.page.drawText('Total do',       { x: rX, y: ry,      size: 14, font: f.bold, color: C.black })
  ry -= 18
  ctx.page.drawText('Investimento:',  { x: rX, y: ry,      size: 14, font: f.bold, color: C.black })
  ry -= 20
  ctx.page.drawText('A partir de:',   { x: rX, y: ry,      size: 8,  font: f.reg,  color: C.g1 })
  ry -= 26

  // Valor grande — EDITÁVEL
  field(ctx, valorFmt, rX, ry, W - MR - rX, {
    size: 20, font: f.bold, color: C.black, lh: 24, padX: 4, padY: 3,
  })

  footerNum(ctx, p.numero)
  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — FORMA DE PAGAMENTO + ASSINATURA
// ═══════════════════════════════════════════════════════════════════════════════
function drawPagamento(ctx: Ctx, p: Proposta) {
  const { f } = ctx
  let y = H - MT

  // ── 04 FORMA DE PAGAMENTO ──
  secNum(ctx, '04', ML, y)
  ctx.page.drawText('FORMA DE PAGAMENTO', {
    x: ML + 28, y, size: 16, font: f.bold, color: C.black,
  })
  y -= 32

  // 4.1 — fixo
  y = txt(ctx, '4.1. A mobilização será executada após o De acordo da proposta.', ML, y, { size: 9.5, maxW: CW, lh: 14 })
  y -= 8

  // 4.2 — EDITÁVEL
  const cond42 = `4.2. ${p.condicoesPagamento}`
  y = field(ctx, cond42, ML, y, CW, {
    size: 9.5, font: f.reg, color: C.g2, lh: 14, padX: 3, padY: 3,
  })
  y -= 8

  // 4.3 — fixo
  y = txt(ctx, '4.3. No caso de atraso, cobra-se multa de 2% (dois por cento) sobre o valor da nota fiscal, mais juros de 1% (um por cento) ao mês.', ML, y, { size: 9.5, maxW: CW, lh: 14 })
  y -= 8

  // Bloco NF
  ctx.page.drawText('a) TYRON ENGENHARIA LTDA',             { x: ML, y, size: 9.5, font: f.reg, color: C.g2 }); y -= 14
  ctx.page.drawText('CNPJ: 40.738.112/0001-69 – NOTA FISCAL.', { x: ML, y, size: 9.5, font: f.reg, color: C.g2 }); y -= 14

  // Descrição NF — EDITÁVEL
  y = field(ctx, p.descricaoNF, ML, y, CW, {
    size: 9, font: f.bold, color: C.black, lh: 13, padX: 3, padY: 3,
  })
  y -= 28

  // ── 05 EXECUÇÃO DOS SERVIÇOS ──
  secNum(ctx, '05', ML, y)
  ctx.page.drawText('EXECUÇÃO DOS SERVIÇOS', {
    x: ML + 28, y, size: 16, font: f.bold, color: C.black,
  })
  y -= 28

  // Validade — EDITÁVEL (apenas o número/extenso no texto)
  const validExt = diasExtenso(p.validade)
  const val51 = `5.1 A proposta tem validade de ${p.validade} (${validExt}) dias a partir da atual data.`
  y = txt(ctx, val51, ML, y, { size: 9.5, maxW: CW, lh: 14 })
  y -= 8
  y = txt(ctx, '5.2. Início dos serviços quando liberado pelo contratante.', ML, y, { size: 9.5, maxW: CW, lh: 14 })
  y -= 36

  // Aviso
  ctx.page.drawText(
    'SOMENTE APÓS A ASSINATURA E ENVIO DO "DE ACORDO" INICIARÃO-SE OS SERVIÇOS.',
    { x: ML, y, size: 8, font: f.bold, color: C.black }
  )
  y -= 30

  // Bloco engenheiro centralizado
  const engLines = [
    `ENGENHEIRO ${p.responsavel.toUpperCase()}`,
    p.crea,
    'TYRON ENGENHARIA - 40.738.112/0001-69',
  ]
  for (const ln of engLines) {
    const tw = f.reg.widthOfTextAtSize(ln, 8.5)
    ctx.page.drawText(ln, { x: (W - tw) / 2, y, size: 8.5, font: f.reg, color: C.black })
    y -= 14
  }
  y -= 22

  // Campos de assinatura do contratante
  const signLabels = ['Nome Legível:', 'Cargo:', 'Razão Social:', 'CNPJ/CPF:']
  for (const lbl of signLabels) {
    ctx.page.drawText(lbl, { x: ML, y, size: 9, font: f.reg, color: C.g2 })
    hline(ctx, ML + 88, y + 2, ML + 290, rgb(0.78, 0.78, 0.78), 0.5)
    y -= 18
  }

  y -= 14
  const assTxt = 'ASSINATURA DO CONTRATANTE'
  ctx.page.drawText(assTxt, {
    x: (W - f.reg.widthOfTextAtSize(assTxt, 8)) / 2,
    y, size: 8, font: f.reg, color: C.g1,
  })
  y -= 16

  // "De acordo" — EDITÁVEL
  field(ctx, `"De acordo" — Referente a esta proposta nº ${p.numero}`, ML, y, CW, {
    size: 9, font: f.reg, color: C.g2, lh: 13, align: 'center', padX: 3, padY: 3,
  })

  footerSite(ctx)
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL EXPORTADA
// ═══════════════════════════════════════════════════════════════════════════════

export interface GerarPDFOptions {
  /** Se true, destaca em amarelo todos os campos que variam por proposta */
  highlight?: boolean
}

/**
 * Gera o PDF da proposta e retorna Uint8Array.
 * Funciona em Vercel Serverless (Node 18+) sem deps externas além de pdf-lib.
 *
 * @example
 *   const bytes = await gerarPropostaPDF(proposta, { highlight: false })
 *   return new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } })
 */
export async function gerarPropostaPDF(
  proposta: Proposta,
  options: GerarPDFOptions = {}
): Promise<Uint8Array> {
  const { highlight = false } = options

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  // Helvetica built-in — zero fetch, zero bundle impact
  const reg  = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fonts: F = { reg, bold }

  const pages = [
    drawCapa,
    drawVisaoGeral,
    drawDetalhamento,
    drawObrigacoesContratante,
    drawGarantia,
    drawInvestimento,
    drawPagamento,
  ]

  for (const drawFn of pages) {
    const page = doc.addPage([W, H])
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.white })
    drawFn({ page, f: fonts, hl: highlight }, proposta)
  }

  doc.setTitle(`Proposta ${proposta.numero} — ${proposta.cliente}`)
  doc.setAuthor('Tyron Engenharia')
  doc.setSubject(proposta.tituloCapa)
  doc.setCreationDate(new Date())

  return doc.save()
}

/** Nome sugerido para o arquivo baixado */
export function propostaPDFFilename(p: Proposta): string {
  const cliente = p.cliente.replace(/[^\w]/g, '_').slice(0, 28)
  return `Proposta_${p.numero}_${cliente}.pdf`
}
