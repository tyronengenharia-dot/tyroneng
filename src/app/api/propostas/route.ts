// app/api/propostas/route.ts
// GET  /api/propostas        → lista todas
// POST /api/propostas        → cria nova

import { NextRequest, NextResponse } from 'next/server'
import { listarPropostas, criarProposta } from '@/services/propostaService'
import { Proposta } from '@/types/proposta'

export async function GET() {
  try {
    const propostas = await listarPropostas()
    return NextResponse.json(propostas)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<Proposta> = await req.json()

    // Garante id e createdAt se não vieram
    const proposta: Proposta = {
      id:                 body.id        || crypto.randomUUID(),
      numero:             body.numero    || '',
      cliente:            body.cliente   || '',
      obra:               body.obra      || '',
      descricao:          body.descricao || '',
      tituloCapa:         body.tituloCapa|| '',
      dataEmissao:        body.dataEmissao || new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          }).format(new Date()),
      objetivo:           body.objetivo  || '',
      etapas:             body.etapas    || [],
      prazoExecucao:      body.prazoExecucao || 30,
      entregaveis:        body.entregaveis   || [],
      valor:              body.valor         || 0,
      valorExtenso:       body.valorExtenso  || '',
      escopaMaterial:     body.escopaMaterial || 'mao_de_obra_e_materiais',
      condicoesPagamento: body.condicoesPagamento || '',
      validade:           body.validade        || 30,
      descricaoNF:        body.descricaoNF     || '',
      responsavel:        body.responsavel     || 'Rodrigo Antunes Ramos',
      crea:               body.crea            || 'CREA/RJ 2019103029',
      status:             body.status          || 'rascunho',
      createdAt:          body.createdAt        || new Date().toISOString(),
    }

    const criada = await criarProposta(proposta)
    return NextResponse.json(criada, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
