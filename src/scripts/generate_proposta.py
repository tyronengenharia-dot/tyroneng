"""
Tyron Engenharia — Gerador de Proposta PDF
Modelo fiel ao documento original (7 páginas)
Campos editáveis destacados em amarelo (#F5C842) quando highlight=True
"""

import sys
import json
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import textwrap
import datetime

W, H = A4  # 595.28 x 841.89 pt
M_LEFT = 22 * mm
M_RIGHT = 22 * mm
M_TOP = 20 * mm
M_BOT = 18 * mm
CONTENT_W = W - M_LEFT - M_RIGHT

# ── Cores ────────────────────────────────────────────────────────────────────
BLACK     = colors.HexColor('#0a0a0a')
WHITE     = colors.white
GRAY_DARK = colors.HexColor('#1a1a1a')
GRAY_MED  = colors.HexColor('#555555')
GRAY_LIGHT= colors.HexColor('#888888')
GRAY_LINE = colors.HexColor('#cccccc')
HIGHLIGHT = colors.HexColor('#F5C842')   # amarelo marca-texto
HL_TEXT   = colors.HexColor('#1a1a00')  # texto sobre highlight
GOLD      = colors.HexColor('#C8A96E')


# ── Helper: campo editável ────────────────────────────────────────────────────
def editable(c: canvas.Canvas, x, y, w, h, value: str, highlight: bool,
             font='Helvetica-Bold', size=10, color=BLACK, align='left',
             padding_x=3, padding_y=1):
    """Desenha campo com highlight opcional (marca-texto amarelo)."""
    if highlight:
        c.setFillColor(HIGHLIGHT)
        c.setStrokeColor(colors.HexColor('#e0b800'))
        c.setLineWidth(0.3)
        c.roundRect(x - padding_x, y - padding_y, w + padding_x * 2, h + padding_y * 2, 2, fill=1, stroke=1)
        c.setFillColor(HL_TEXT)
    else:
        c.setFillColor(color)

    c.setFont(font, size)
    text_y = y + 1.5
    if align == 'left':
        c.drawString(x, text_y, value)
    elif align == 'right':
        c.drawRightString(x + w, text_y, value)
    elif align == 'center':
        c.drawCentredString(x + w / 2, text_y, value)


def draw_footer_website(c: canvas.Canvas, page_num: int = None):
    """Rodapé com URL."""
    c.setFont('Helvetica', 7)
    c.setFillColor(GRAY_MED)
    c.drawCentredString(W / 2, M_BOT - 4 * mm, 'WWW.TYRONENGENHARIA.COM')
    if page_num:
        c.drawRightString(W - M_RIGHT, M_BOT - 4 * mm, f'Proposta {page_num}')


def wrap_text(c: canvas.Canvas, text: str, x, y, max_width, font, size, color,
              line_height=14, align='left') -> float:
    """Quebra texto em linhas. Retorna novo y."""
    c.setFont(font, size)
    c.setFillColor(color)
    avg_char = size * 0.55
    chars_per_line = max(1, int(max_width / avg_char))
    lines = []
    for paragraph in text.split('\n'):
        wrapped = textwrap.wrap(paragraph, width=chars_per_line) or ['']
        lines.extend(wrapped)
    for line in lines:
        if align == 'center':
            c.drawCentredString(x + max_width / 2, y, line)
        elif align == 'right':
            c.drawRightString(x + max_width, y, line)
        else:
            c.drawString(x, y, line)
        y -= line_height
    return y


def draw_divider(c, y, x=M_LEFT, w=None, color=GRAY_LINE, thickness=0.5):
    w = w or CONTENT_W
    c.setStrokeColor(color)
    c.setLineWidth(thickness)
    c.line(x, y, x + w, y)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 1 — CAPA
# ══════════════════════════════════════════════════════════════════════════════
def page_capa(c: canvas.Canvas, data: dict, hl: bool):
    # Fundo preto total
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Bloco superior direito — informações do cliente
    bx = W - M_RIGHT - 160
    by = H - M_TOP - 12

    c.setFont('Helvetica', 7)
    c.setFillColor(GRAY_LIGHT)
    c.drawRightString(W - M_RIGHT, by, 'CLIENTE:')

    by -= 14
    editable(c, bx, by, 160, 12, data['cliente'], hl,
             font='Helvetica-Bold', size=11, color=WHITE, align='right')

    by -= 26
    c.setFont('Helvetica', 7)
    c.setFillColor(GRAY_LIGHT)
    c.drawRightString(W - M_RIGHT, by, 'PROJECT NAME:')

    by -= 14
    editable(c, bx, by, 160, 12, data['obra'], hl,
             font='Helvetica-Bold', size=11, color=WHITE, align='right')

    by -= 26
    c.setFont('Helvetica', 7)
    c.setFillColor(GRAY_LIGHT)
    c.drawRightString(W - M_RIGHT, by, 'PROPOSTA NÚMERO')

    by -= 18
    editable(c, bx, by, 160, 16, data['numero'], hl,
             font='Helvetica-Bold', size=18, color=WHITE, align='right')

    # Grid de pontos decorativos direita
    _draw_dot_grid(c, W - M_RIGHT - 90, H - M_TOP - 120, 9, 18, GRAY_DARK)
    _draw_dot_grid(c, M_LEFT, H - M_TOP - 380, 18, 18, GRAY_DARK)

    # Logo (T estilizado)
    lx, ly = M_LEFT, H - M_TOP - 45
    c.setFillColor(WHITE)
    c.setFont('Helvetica-Bold', 28)
    c.drawString(lx, ly, 'T')
    c.setFont('Helvetica', 10)
    c.setFillColor(GRAY_LIGHT)
    c.drawString(lx + 16, ly + 4, 'Y R')
    c.drawString(lx + 12, ly - 10, 'N')

    # Título central grande
    tx = M_LEFT
    ty = H / 2 + 30

    # Título da obra — campo editável
    title_lines = data['titulo_capa'] if 'titulo_capa' in data else data['obra'].upper()
    c.setFont('Helvetica-Bold', 32)
    c.setFillColor(WHITE)
    y_t = ty
    for line in title_lines.split('\n'):
        c.drawString(tx, y_t, line)
        y_t -= 38

    # Data
    editable(c, tx, y_t - 10, 200, 12, data['data_emissao'], hl,
             font='Helvetica', size=11, color=GRAY_LIGHT, align='left')

    # Rodapé
    c.setFont('Helvetica', 8)
    c.setFillColor(GRAY_LIGHT)
    c.drawString(M_LEFT, M_BOT + 2, '21 98174-2139')
    c.drawRightString(W - M_RIGHT, M_BOT + 10, '@tyronengenharia')
    c.drawRightString(W - M_RIGHT, M_BOT + 0, 'www.tyronengenharia.com')


def _draw_dot_grid(c, x0, y0, cols, rows, color, spacing=9):
    c.setFillColor(color)
    for row in range(rows):
        for col in range(cols):
            cx = x0 + col * spacing
            cy = y0 - row * spacing
            c.circle(cx, cy, 1, fill=1, stroke=0)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 2 — VISÃO GERAL + OBJETIVOS
# ══════════════════════════════════════════════════════════════════════════════
def page_visao_geral(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - M_TOP - 10

    # 01 VISÃO GERAL
    _section_number(c, '01', M_LEFT, y)
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'VISÃO GERAL')
    y -= 30

    texto_visao = (
        'Esta é uma proposta que contém o esboço e o escopo do projeto — de todas as etapas '
        'principais que tomaremos, marcos que definimos de antemão e o preço do projeto. '
        'Quaisquer dúvidas sobre aspectos desta proposta, entre em contato por e-mail ou '
        'através do nosso site.\n\n'
        'Todo o conteúdo desta proposta é confidencial e destinado apenas ao cliente e aos seus '
        'afiliados. Caso esteja recebendo esta proposta como terceiro por acidente, informe-nos!'
    )
    y = wrap_text(c, texto_visao, M_LEFT, y, CONTENT_W, 'Helvetica', 9.5,
                  GRAY_MED, line_height=15, align='justify')
    y -= 28

    # 02 OBJETIVOS
    _section_number(c, '02', M_LEFT, y)
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'OBJETIVOS')
    draw_divider(c, y - 4, x=M_LEFT + 160, w=CONTENT_W - 160, color=GRAY_LINE)
    y -= 28

    # Coluna esquerda — descrição (editável)
    col_w = CONTENT_W * 0.52
    right_x = M_LEFT + col_w + 15
    right_w = CONTENT_W - col_w - 15

    # Parágrafo de objetivo (editável)
    obj_text = data.get('objetivo', data.get('descricao', ''))
    c.setFont('Helvetica', 9.5)
    c.setFillColor(GRAY_MED)
    if hl:
        c.setFillColor(HIGHLIGHT)
        c.roundRect(M_LEFT - 2, y - 80, col_w + 4, 84, 2, fill=1, stroke=0)
        c.setFillColor(HL_TEXT)
    y_obj = wrap_text(c, obj_text, M_LEFT, y - 2, col_w, 'Helvetica', 9.5,
                      HL_TEXT if hl else GRAY_MED, line_height=14, align='justify')

    # Coluna direita — 3 blocos fixos
    blocks = [
        ('ESTUDO DE CASO', 'Desenvolvemos um estudo de caso específico para o seu projeto'),
        ('PROJETO', 'Criamos um plano estratégico alinhado às necessidades e expectativas.'),
        ('ENTREGA', 'Entregamos dentro do cronograma e com toda garantia e segurança nas operações.'),
    ]
    ry = y
    for title, body in blocks:
        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(BLACK)
        c.drawString(right_x, ry, title)
        ry -= 4
        draw_divider(c, ry, x=right_x, w=right_w, color=GRAY_LINE, thickness=0.3)
        ry -= 14
        c.setFont('Helvetica', 9)
        c.setFillColor(GRAY_MED)
        for line in textwrap.wrap(body, 35):
            c.drawString(right_x, ry, line)
            ry -= 13
        ry -= 10

    # Rodapé
    _footer_proposta(c, data['numero'])
    draw_footer_website(c)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 3 — DETALHAMENTO + OBRIGAÇÕES TYRON
# ══════════════════════════════════════════════════════════════════════════════
def page_detalhamento(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - M_TOP - 10

    _section_number(c, '01', M_LEFT, y)
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'DETALHAMENTO DO SERVIÇO SOLICITADO')
    y -= 26

    # Etapas editáveis
    etapas = data.get('etapas', [])
    if hl and etapas:
        # highlight block
        block_h = len(etapas) * 22 + 8
        c.setFillColor(HIGHLIGHT)
        c.roundRect(M_LEFT - 3, y - block_h + 8, CONTENT_W + 6, block_h, 2, fill=1, stroke=0)

    for etapa in etapas:
        bullet_x = M_LEFT + 4
        text_x = M_LEFT + 14
        c.setFillColor(HL_TEXT if hl else BLACK)
        c.setFont('Helvetica', 8)
        c.drawString(bullet_x, y, '•')
        c.setFont('Helvetica', 9.5)
        c.setFillColor(HL_TEXT if hl else GRAY_MED)
        lines = textwrap.wrap(etapa, 82)
        for i, line in enumerate(lines):
            c.drawString(text_x, y, line)
            y -= 13
        y -= 5
        if y < M_BOT + 120:
            break

    y -= 14

    # 02 Obrigações Tyron (texto fixo)
    _section_number(c, '02', M_LEFT, y)
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'OBRIGAÇÕES DA TYRON ENGENHARIA')
    y -= 22

    obrig_tyron = [
        'Fornecer ART - CREA RJ',
        'Disponibilizar mão de obra qualificada, equipamentos e ferramentas necessárias à correta execução do serviço.',
        'Fornecer todos os materiais necessários à execução das bases de concreto armado, incluindo cimento, areia, brita, aço para armação, fôrmas e espaçadores, salvo itens expressamente excluídos em contrato.',
        'Realizar a montagem das armações, fôrmas e concretagem conforme dimensionamento técnico previsto.',
        'Garantir o nivelamento, alinhamento e resistência estrutural das bases conforme especificação.',
    ]
    for item in obrig_tyron:
        if y < M_BOT + 30:
            break
        c.setFont('Helvetica', 8)
        c.setFillColor(BLACK)
        c.drawString(M_LEFT + 4, y, '•')
        c.setFont('Helvetica', 9.5)
        c.setFillColor(GRAY_MED)
        lines = textwrap.wrap(item, 82)
        for line in lines:
            c.drawString(M_LEFT + 14, y, line)
            y -= 13
        y -= 5

    _footer_proposta(c, data['numero'])
    draw_footer_website(c)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 4 — OBRIGAÇÕES CONTRATANTE
# ══════════════════════════════════════════════════════════════════════════════
def page_obrigacoes_contratante(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - M_TOP - 10

    obrig_cont_extra = [
        'Zelar pela segurança do trabalho, fornecendo e exigindo o uso de EPIs e adotando medidas preventivas durante a execução.',
        'Manter o local de trabalho organizado, realizando a limpeza ao final dos serviços.',
        'Cumprir o prazo de execução acordado, salvo intercorrências técnicas, climáticas ou de força maior devidamente justificadas.',
        'Responsabilizar-se pela qualidade dos serviços e materiais empregados, realizando correções necessárias dentro do escopo contratado.',
    ]
    for item in obrig_cont_extra:
        c.setFont('Helvetica', 8)
        c.setFillColor(BLACK)
        c.drawString(M_LEFT + 4, y, '•')
        c.setFont('Helvetica', 9.5)
        c.setFillColor(GRAY_MED)
        for line in textwrap.wrap(item, 82):
            c.drawString(M_LEFT + 14, y, line)
            y -= 13
        y -= 5

    y -= 20

    _section_number(c, '03', M_LEFT, y)
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'OBRIGAÇÕES DA CONTRATANTE')
    y -= 22

    obrig_cont = [
        'Disponibilizar o acesso livre e seguro ao local da obra, permitindo a execução dos serviços nos prazos acordados.',
        'Garantir que o local esteja desimpedido, limpo e apto para o início dos trabalhos, salvo serviços previamente contratados à parte.',
        'Fornecer as informações, autorizações e documentos necessários à execução do serviço, quando aplicável.',
        'Indicar um responsável para acompanhamento e validação dos serviços executados.',
        'Efetuar os pagamentos nas condições, valores e prazos estabelecidos na proposta/contrato.',
        'Comunicar previamente qualquer interferência, restrição ou condição especial existente no local que possa impactar a execução dos serviços.',
        'Responsabilizar-se pela instalação das caixas d\'água.',
        'Não intervir diretamente na execução dos serviços, salvo por meio de solicitações formais à Tyron Engenharia.',
    ]
    for item in obrig_cont:
        if y < M_BOT + 30:
            break
        c.setFont('Helvetica', 8)
        c.setFillColor(BLACK)
        c.drawString(M_LEFT + 4, y, '•')
        c.setFont('Helvetica', 9.5)
        c.setFillColor(GRAY_MED)
        for line in textwrap.wrap(item, 82):
            c.drawString(M_LEFT + 14, y, line)
            y -= 13
        y -= 5

    _footer_proposta(c, data['numero'])
    draw_footer_website(c)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 5 — GARANTIA + CRONOGRAMA
# ══════════════════════════════════════════════════════════════════════════════
def page_garantia(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - M_TOP - 10

    # GARANTIA
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT, y, 'GARANTIA')
    draw_divider(c, y - 6, color=GRAY_LINE)
    y -= 30

    garantia_text = (
        'A Tyron Engenharia garante os serviços executados pelo prazo de 05 (cinco) anos, '
        'conforme disposto no art. 618 do Código Civil Brasileiro, contados a partir da data de '
        'conclusão e entrega da obra, respondendo pela solidez e segurança estrutural das bases '
        'de concreto armado executadas.\n\n'
        'A garantia cobre eventuais vícios ou falhas construtivas decorrentes de erro de execução '
        'ou materiais fornecidos pela contratada, desde que comprovados tecnicamente.\n\n'
        'A garantia não cobre danos decorrentes de:\n'
        '• Uso inadequado ou sobrecarga das bases;\n'
        '• Instalação incorreta das caixas d\'água por terceiros;\n'
        '• Alterações, intervenções ou reformas realizadas por terceiros sem autorização da Tyron Engenharia;\n'
        '• Ações da natureza, sinistros, recalques do solo não previstos ou fatores externos fora do controle da contratada.\n\n'
        'Caso seja identificado algum problema coberto pela garantia, a Tyron Engenharia compromete-se '
        'a realizar os reparos necessários, sem ônus adicional, dentro de prazo tecnicamente razoável.'
    )
    y = wrap_text(c, garantia_text, M_LEFT, y, CONTENT_W, 'Helvetica', 9.5,
                  GRAY_MED, line_height=14, align='justify')
    y -= 35

    # CRONOGRAMA
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT, y, 'CRONOGRAMA')
    draw_divider(c, y - 6, color=GRAY_LINE)
    y -= 35

    # Bloco 01 com prazo editável
    box_size = 28
    c.setFillColor(BLACK)
    c.rect(M_LEFT, y - box_size + 10, box_size, box_size, fill=1, stroke=0)
    c.setFont('Helvetica-Bold', 14)
    c.setFillColor(WHITE)
    c.drawCentredString(M_LEFT + box_size / 2, y - box_size + 17, '01')

    text_x = M_LEFT + box_size + 12
    cronograma_base = f'O prazo estimado para a execução de aproximadamente '
    c.setFont('Helvetica', 9.5)
    c.setFillColor(GRAY_MED)
    c.drawString(text_x, y, cronograma_base)

    area_text = data.get('area_execucao', '80 m²')
    prazo_dias = str(data.get('prazoExecucao', 30))
    prazo_extenso = _num_extenso(int(prazo_dias))

    full_line = f'{area_text} de laje em concreto armado é de {prazo_dias} ({prazo_extenso}) dias corridos.'
    c.drawString(text_x, y - 14, full_line)

    if hl:
        # highlight o prazo
        c.setFillColor(HIGHLIGHT)
        c.roundRect(text_x + 185, y - 16, 80, 13, 2, fill=1, stroke=0)
        c.setFont('Helvetica-Bold', 9.5)
        c.setFillColor(HL_TEXT)
        c.drawString(text_x + 187, y - 14, f'{prazo_dias} ({prazo_extenso})')

    y -= 40
    c.setFont('Helvetica', 8)
    c.setFillColor(GRAY_LIGHT)
    c.drawString(text_x, y, 'DURAÇÃO DA ETAPA')
    y -= 14
    editable(c, text_x, y, 120, 14, f'{prazo_dias} dias corridos', hl,
             font='Helvetica-Bold', size=11, color=BLACK)

    _footer_proposta(c, data['numero'])
    draw_footer_website(c)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 6 — ENTREGÁVEIS + INVESTIMENTO
# ══════════════════════════════════════════════════════════════════════════════
def page_investimento(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Logo canto superior direito
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(BLACK)
    c.drawRightString(W - M_RIGHT, H - M_TOP - 5, 'T')
    c.setFont('Helvetica', 9)
    c.setFillColor(GRAY_LIGHT)
    c.drawRightString(W - M_RIGHT, H - M_TOP - 18, 'Y R  N')

    y = H - M_TOP - 45

    # ENTREGÁVEIS
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT, y, 'ENTREGÁVEIS')
    draw_divider(c, y - 6, color=GRAY_LINE)
    y -= 30

    entregaveis = data.get('entregaveis', [
        'PROJETO ESTRUTURAL',
        'LAJE DE APROXIMADAMENTE 80 M² EM CONCRETO ARMADO',
        'ART - CREA/RJ',
    ])

    if hl:
        block_h = len(entregaveis) * 22 + 8
        c.setFillColor(HIGHLIGHT)
        c.roundRect(M_LEFT - 3, y - block_h + 8, CONTENT_W * 0.6, block_h, 2, fill=1, stroke=0)

    for item in entregaveis:
        c.setFont('Helvetica-Bold', 9.5)
        c.setFillColor(HL_TEXT if hl else BLACK)
        c.drawString(M_LEFT + 4, y, '•  ' + item)
        y -= 22
    y -= 20

    # INVESTIMENTO
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT, y, 'INVESTIMENTO')
    draw_divider(c, y - 6, color=GRAY_LINE)
    y -= 30

    valor_fmt = _format_brl(data['valor'])
    valor_extenso = data.get('valor_extenso', '')

    invest_text = (
        f'O investimento total para a execução dos serviços descritos nesta proposta é de '
        f'{valor_fmt}'
        + (f' ({valor_extenso}).' if valor_extenso else '.')
        + '\n\nEste valor contempla fornecimento de materiais, mão de obra, equipamentos, '
        'execução da laje/base em concreto armado, bem como todos os itens previstos no '
        'escopo e entregáveis acordados.'
    )

    # highlight valor dentro do texto
    y_before = y
    c.setFont('Helvetica', 9.5)
    c.setFillColor(GRAY_MED)
    if hl:
        # highlight box para parágrafo de investimento
        c.setFillColor(colors.HexColor('#fffbe6'))
        c.roundRect(M_LEFT - 2, y - 70, CONTENT_W * 0.65 + 4, 74, 2, fill=1, stroke=0)
    y = wrap_text(c, invest_text, M_LEFT, y - 2, CONTENT_W * 0.65, 'Helvetica', 9.5,
                  GRAY_MED, line_height=14, align='justify')

    # Bloco valor total — lado direito
    rx = M_LEFT + CONTENT_W * 0.68
    ry = y_before

    c.setFont('Helvetica-Bold', 10)
    c.setFillColor(BLACK)
    c.drawString(rx, ry, 'Total do')
    ry -= 13
    c.drawString(rx, ry, 'Investimento:')
    ry -= 18
    c.setFont('Helvetica', 8)
    c.setFillColor(GRAY_LIGHT)
    c.drawString(rx, ry, 'A partir de:')
    ry -= 22

    editable(c, rx, ry, W - M_RIGHT - rx, 22, valor_fmt, hl,
             font='Helvetica-Bold', size=20, color=BLACK, align='left')

    _footer_proposta(c, data['numero'])
    draw_footer_website(c)


# ══════════════════════════════════════════════════════════════════════════════
# PÁGINA 7 — FORMA DE PAGAMENTO + ASSINATURA
# ══════════════════════════════════════════════════════════════════════════════
def page_pagamento(c: canvas.Canvas, data: dict, hl: bool):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - M_TOP - 10

    _section_number(c, '04', M_LEFT, y)
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'FORMA DE PAGAMENTO')
    y -= 28

    pagamento_texto = data.get('condicoesPagamento', '50% para início dos serviços e 50% após a finalização.')
    pag_lines = [
        '4.1. A mobilização será executada após o De acordo da proposta.',
        f'4.2. {pagamento_texto}',
        '4.3. No caso de atraso, cobra-se multa de 2% (dois por cento) sobre o valor da nota fiscal, mais juros de 1% (um por cento) ao mês.',
        '',
        'a) TYRON ENGENHARIA LTDA',
        'CNPJ: 40.738.112/0001-69 – NOTA FISCAL.',
    ]

    # Linha 4.2 é editável
    for i, line in enumerate(pag_lines):
        if not line:
            y -= 8
            continue
        is_editable = (i == 1)
        if is_editable and hl:
            lw = CONTENT_W
            lh = 14 * (len(textwrap.wrap(line, 82)) + 1)
            c.setFillColor(HIGHLIGHT)
            c.roundRect(M_LEFT - 2, y - lh + 10, lw + 4, lh, 2, fill=1, stroke=0)
            c.setFont('Helvetica', 9.5)
            c.setFillColor(HL_TEXT)
        else:
            c.setFont('Helvetica', 9.5)
            c.setFillColor(GRAY_MED)
        for part in textwrap.wrap(line, 82) or ['']:
            c.drawString(M_LEFT, y, part)
            y -= 14
        y -= 3

    # Nota fiscal descritivo (editável)
    nf_text = data.get('descricao_nf', 'EXECUÇÃO DE SERVIÇOS DE ENGENHARIA CIVIL CONFORME PROPOSTA.')
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(BLACK)
    editable(c, M_LEFT, y, CONTENT_W, 14, nf_text, hl,
             font='Helvetica-Bold', size=8, color=BLACK)
    y -= 35

    # 05 EXECUÇÃO
    _section_number(c, '05', M_LEFT, y)
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT + 28, y, 'EXECUÇÃO DOS SERVIÇOS')
    y -= 22

    validade = str(data.get('validade', 30))
    exec_lines = [
        f'5.1 A proposta tem validade de {validade} (trinta) dias a partir da atual data.',
        '5.2. Início dos serviços quando liberado pelo contratante.',
    ]
    for line in exec_lines:
        c.setFont('Helvetica', 9.5)
        c.setFillColor(GRAY_MED)
        c.drawString(M_LEFT, y, line)
        y -= 16
    y -= 20

    # Aviso
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(BLACK)
    c.drawString(M_LEFT, y,
                 'SOMENTE APÓS A ASSINATURA E ENVIO DO "DE ACORDO" INICIARÃO-SE OS SERVIÇOS.')
    y -= 30

    # Bloco engenheiro
    engenheiro = data.get('responsavel', 'Rodrigo Antunes Ramos')
    crea = data.get('crea', 'CREA/RJ 2019103029')
    center_x = W / 2

    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(BLACK)
    c.drawCentredString(center_x, y, f'ENGENHEIRO {engenheiro.upper()}')
    y -= 13
    c.setFont('Helvetica', 9)
    c.drawCentredString(center_x, y, crea)
    y -= 13
    c.drawCentredString(center_x, y, 'TYRON ENGENHARIA - 40.738.112/0001-69')
    y -= 50

    # Bloco assinatura contratante
    sign_x = M_LEFT
    sign_fields = ['Nome Legível:', 'Cargo:', 'Razão Social:', 'CNPJ/CPF:']
    for field in sign_fields:
        c.setFont('Helvetica', 9)
        c.setFillColor(GRAY_MED)
        c.drawString(sign_x, y, field)
        # linha para assinar
        c.setStrokeColor(GRAY_LINE)
        c.setLineWidth(0.5)
        c.line(sign_x + 80, y + 2, sign_x + 240, y + 2)
        y -= 18

    y -= 15
    c.setFont('Helvetica', 8)
    c.setFillColor(GRAY_LIGHT)
    c.drawCentredString(W / 2, y, 'ASSINATURA DO CONTRATANTE')
    y -= 16
    c.setFont('Helvetica', 9)
    c.setFillColor(GRAY_MED)

    editable(c, M_LEFT, y, CONTENT_W, 12,
             f'"De acordo" — Referente a esta proposta nº {data["numero"]}',
             hl, font='Helvetica', size=9, color=GRAY_MED, align='center')

    draw_footer_website(c)


# ── Helpers internos ──────────────────────────────────────────────────────────
def _section_number(c: canvas.Canvas, num: str, x, y):
    c.setFont('Helvetica', 11)
    c.setFillColor(GRAY_LIGHT)
    c.drawString(x, y, num)


def _footer_proposta(c: canvas.Canvas, numero: str):
    c.setFont('Helvetica', 8)
    c.setFillColor(GRAY_LIGHT)
    c.drawRightString(W - M_RIGHT, M_BOT + 2, f'Proposta {numero}')


def _format_brl(value) -> str:
    try:
        v = float(str(value).replace('.', '').replace(',', '.'))
    except Exception:
        return str(value)
    return f'R$ {v:_.2f}'.replace('.', ',').replace('_', '.')


def _num_extenso(n: int) -> str:
    extensos = {
        7: 'sete', 10: 'dez', 14: 'quatorze', 15: 'quinze', 20: 'vinte',
        25: 'vinte e cinco', 30: 'trinta', 45: 'quarenta e cinco',
        60: 'sessenta', 90: 'noventa', 120: 'cento e vinte',
    }
    return extensos.get(n, str(n))


# ══════════════════════════════════════════════════════════════════════════════
# FUNÇÃO PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════
def generate_pdf(data: dict, output_path: str, highlight: bool = False):
    """
    Gera o PDF da proposta.
    data: dict com campos da proposta
    output_path: caminho de saída
    highlight: se True, destaca campos editáveis em amarelo
    """
    # defaults
    data.setdefault('data_emissao', datetime.date.today().strftime('%d de %B de %Y'))
    data.setdefault('objetivo', data.get('descricao', ''))

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"Proposta {data.get('numero', '')} — Tyron Engenharia")
    c.setAuthor('Tyron Engenharia')
    c.setSubject(data.get('obra', ''))

    pages = [
        page_capa,
        page_visao_geral,
        page_detalhamento,
        page_obrigacoes_contratante,
        page_garantia,
        page_investimento,
        page_pagamento,
    ]

    for i, page_fn in enumerate(pages):
        page_fn(c, data, highlight)
        if i < len(pages) - 1:
            c.showPage()

    c.save()
    return output_path


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import locale
    try:
        locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
    except Exception:
        pass

    if len(sys.argv) < 3:
        print('Usage: python generate_proposta.py <data_json> <output_path> [highlight]')
        sys.exit(1)

    data_json = sys.argv[1]
    out_path = sys.argv[2]
    hl = len(sys.argv) > 3 and sys.argv[3].lower() == 'true'

    data = json.loads(data_json)
    generate_pdf(data, out_path, highlight=hl)
    print(f'PDF gerado: {out_path}')
