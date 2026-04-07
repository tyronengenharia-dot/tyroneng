// app/api/propostas/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { buscarProposta, atualizarProposta, excluirProposta } from '@/services/propostaService'

interface Ctx { params: Promise<{ id: string }> }  // ← Promise aqui

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params  // ← await aqui
    const proposta = await buscarProposta(id)
    if (!proposta) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
    return NextResponse.json(proposta)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params  // ← await aqui
    const updates = await req.json()
    const atualizada = await atualizarProposta(id, updates)
    return NextResponse.json(atualizada)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params  // ← await aqui
    await excluirProposta(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}