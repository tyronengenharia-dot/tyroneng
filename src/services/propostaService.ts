// src/services/propostaService.ts
// CRUD completo de propostas ↔ Supabase
// Converte snake_case do banco ↔ camelCase do TypeScript automaticamente

import { supabase } from '@/lib/supabaseClient'
import { Proposta, PropostaStatus } from '@/types/proposta'

// ── Row do banco (snake_case) ─────────────────────────────────────────────────
interface PropostaRow {
  id:                  string
  numero:              string
  cliente:             string
  titulo_capa:         string
  data_emissao:        string
  objetivo:            string
  etapas:              string[]
  prazo_execucao:      number
  entregaveis:         string[]
  valor:               number
  valor_extenso:       string
  escopa_material:     string
  condicoes_pagamento: string
  validade:            number
  descricao_nf:        string
  responsavel:         string
  crea:                string
  status:              string
  created_at:          string
  updated_at:          string
}

// ── Conversões ────────────────────────────────────────────────────────────────

function rowToProposta(row: PropostaRow): Proposta {
  return {
    id:                 row.id,
    numero:             row.numero,
    cliente:            row.cliente,
    tituloCapa:         row.titulo_capa,
    dataEmissao:        row.data_emissao,
    objetivo:           row.objetivo,
    etapas:             row.etapas ?? [],
    prazoExecucao:      row.prazo_execucao,
    entregaveis:        row.entregaveis ?? [],
    valor:              Number(row.valor),
    valorExtenso:       row.valor_extenso,
    escopaMaterial:     row.escopa_material as Proposta['escopaMaterial'],
    condicoesPagamento: row.condicoes_pagamento,
    validade:           row.validade,
    descricaoNF:        row.descricao_nf,
    responsavel:        row.responsavel,
    crea:               row.crea,
    status:             row.status as PropostaStatus,
    createdAt:          row.created_at,
  }
}

function propostaToInsert(p: Proposta): Omit<PropostaRow, 'updated_at'> {
  return {
    id:                  p.id,
    numero:              p.numero,
    cliente:             p.cliente,
    titulo_capa:         p.tituloCapa,
    data_emissao:        p.dataEmissao,
    objetivo:            p.objetivo,
    etapas:              p.etapas,
    prazo_execucao:      p.prazoExecucao,
    entregaveis:         p.entregaveis,
    valor:               p.valor,
    valor_extenso:       p.valorExtenso,
    escopa_material:     p.escopaMaterial,
    condicoes_pagamento: p.condicoesPagamento,
    validade:            p.validade,
    descricao_nf:        p.descricaoNF,
    responsavel:         p.responsavel,
    crea:                p.crea,
    status:              p.status,
    created_at:          p.createdAt,
  }
}

// ── Funções de serviço ────────────────────────────────────────────────────────

/** Lista todas as propostas, ordenadas pela mais recente */
export async function listarPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erro ao listar propostas: ${error.message}`)
  return (data as PropostaRow[]).map(rowToProposta)
}

/** Busca uma proposta pelo ID */
export async function buscarProposta(id: string): Promise<Proposta | null> {
  const { data, error } = await supabase
    .from('propostas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Erro ao buscar proposta: ${error.message}`)
  }
  return rowToProposta(data as PropostaRow)
}

/** Cria uma nova proposta no banco */
export async function criarProposta(p: Proposta): Promise<Proposta> {
  const row = propostaToInsert(p)

  const { data, error } = await supabase
    .from('propostas')
    .insert(row)
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar proposta: ${error.message}`)
  return rowToProposta(data as PropostaRow)
}

/** Atualiza todos os campos editáveis de uma proposta */
export async function atualizarProposta(
  id: string,
  updates: Partial<Proposta>
): Promise<Proposta> {
  // Converte apenas os campos que chegaram
  const row: Partial<PropostaRow> = {}
  if (updates.numero             !== undefined) row.numero              = updates.numero
  if (updates.cliente            !== undefined) row.cliente             = updates.cliente
  if (updates.tituloCapa         !== undefined) row.titulo_capa         = updates.tituloCapa
  if (updates.dataEmissao        !== undefined) row.data_emissao        = updates.dataEmissao
  if (updates.objetivo           !== undefined) row.objetivo            = updates.objetivo
  if (updates.etapas             !== undefined) row.etapas              = updates.etapas
  if (updates.prazoExecucao      !== undefined) row.prazo_execucao      = updates.prazoExecucao
  if (updates.entregaveis        !== undefined) row.entregaveis         = updates.entregaveis
  if (updates.valor              !== undefined) row.valor               = updates.valor
  if (updates.valorExtenso       !== undefined) row.valor_extenso       = updates.valorExtenso
  if (updates.escopaMaterial     !== undefined) row.escopa_material     = updates.escopaMaterial
  if (updates.condicoesPagamento !== undefined) row.condicoes_pagamento = updates.condicoesPagamento
  if (updates.validade           !== undefined) row.validade            = updates.validade
  if (updates.descricaoNF        !== undefined) row.descricao_nf        = updates.descricaoNF
  if (updates.responsavel        !== undefined) row.responsavel         = updates.responsavel
  if (updates.crea               !== undefined) row.crea                = updates.crea
  if (updates.status             !== undefined) row.status              = updates.status

  const { data, error } = await supabase
    .from('propostas')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar proposta: ${error.message}`)
  return rowToProposta(data as PropostaRow)
}

/** Atualiza só o status (aprovada, enviada, rejeitada...) */
export async function atualizarStatus(
  id: string,
  status: PropostaStatus
): Promise<void> {
  const { error } = await supabase
    .from('propostas')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar status: ${error.message}`)
}

/** Exclui uma proposta permanentemente */
export async function excluirProposta(id: string): Promise<void> {
  const { error } = await supabase
    .from('propostas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir proposta: ${error.message}`)
}
