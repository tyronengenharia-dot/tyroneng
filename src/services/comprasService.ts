import { supabase } from '@/lib/supabaseClient'
import type {
  SolicitacaoCompra,
  CotacaoFornecedor,
  PedidoCompra,
  Entrega,
  Fornecedor,
  AuditoriaLog,
  MetricasCompras,
  FiltroSolicitacoes,
  FiltroCotacoes,
  FiltroEntregas,
} from '@/types/compras'

// ─── Solicitações ───────────────────────────────────────────────────────────

export async function getSolicitacoes(filtros?: FiltroSolicitacoes) {
  let query = supabase
    .from('solicitacoes_compra')
    .select('*')
    .order('created_at', { ascending: false })

  if (filtros?.status && filtros.status !== 'todas') {
    query = query.eq('status', filtros.status)
  }
  if (filtros?.urgencia && filtros.urgencia !== 'todas') {
    query = query.eq('urgencia', filtros.urgencia)
  }
  if (filtros?.busca) {
    query = query.ilike('descricao', `%${filtros.busca}%`)
  }
  if (filtros?.obra_id) {
    query = query.eq('obra_id', filtros.obra_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data as SolicitacaoCompra[]
}

export async function getSolicitacaoById(id: string) {
  const { data, error } = await supabase
    .from('solicitacoes_compra')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SolicitacaoCompra
}

export async function createSolicitacao(
  payload: Omit<SolicitacaoCompra, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('solicitacoes_compra')
    .insert([{ ...payload, status: 'pendente' }])
    .select()
    .single()

  if (error) throw error
  await registrarLog({
    acao: 'Solicitação criada',
    descricao: `Solicitação "${payload.descricao}" criada`,
    usuario: payload.solicitante,
    referencia_id: data.id,
    referencia_tipo: 'solicitacao',
    data: ''
  })
  return data as SolicitacaoCompra
}

export async function updateSolicitacaoStatus(
  id: string,
  status: SolicitacaoCompra['status'],
  usuario: string
) {
  const { data, error } = await supabase
    .from('solicitacoes_compra')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await registrarLog({
    acao: `Status alterado para ${status}`,
    usuario,
    referencia_id: id,
    referencia_tipo: 'solicitacao',
    data: ''
  })
  return data as SolicitacaoCompra
}

export async function deleteSolicitacao(id: string) {
  const { error } = await supabase
    .from('solicitacoes_compra')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Cotações ───────────────────────────────────────────────────────────────

export async function getCotacoesBySolicitacao(
  solicitacao_id: string,
  filtros?: FiltroCotacoes
) {
  let query = supabase
    .from('cotacoes_fornecedor')
    .select('*')
    .eq('solicitacao_id', solicitacao_id)
    .order('valor', { ascending: true })

  if (filtros?.busca) {
    query = query.ilike('fornecedor', `%${filtros.busca}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as CotacaoFornecedor[]
}

export async function getAllCotacoes() {
  const { data, error } = await supabase
    .from('cotacoes_fornecedor')
    .select('*, solicitacoes_compra(descricao, status)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CotacaoFornecedor[]
}

export async function createCotacao(
  payload: Omit<CotacaoFornecedor, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('cotacoes_fornecedor')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  await registrarLog({
    acao: 'Cotação adicionada',
    descricao: `Cotação de ${payload.fornecedor} — R$ ${payload.valor.toLocaleString('pt-BR')}`,
    usuario: 'sistema',
    referencia_id: payload.solicitacao_id,
    referencia_tipo: 'cotacao',
    data: ''
  })
  return data as CotacaoFornecedor
}

// ─── Selecionar cotação → cria pedido aguardando aprovação ───────────────────

export async function selecionarCotacao(
  cotacao_id: string,
  solicitacao_id: string,
  usuario: string
): Promise<{ cotacao: CotacaoFornecedor; pedido: PedidoCompra }> {
  // 1. Desmarca todas as cotações da solicitação
  await supabase
    .from('cotacoes_fornecedor')
    .update({ selecionada: false })
    .eq('solicitacao_id', solicitacao_id)

  // 2. Marca a cotação escolhida
  const { data: cotacao, error: errCotacao } = await supabase
    .from('cotacoes_fornecedor')
    .update({ selecionada: true })
    .eq('id', cotacao_id)
    .select()
    .single()

  if (errCotacao) throw errCotacao

  await registrarLog({
  acao: 'Cotação selecionada',
  descricao: `${cotacao.fornecedor} selecionado — R$ ${cotacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — prazo ${cotacao.prazo_dias} dias`,
  usuario,
  referencia_id: solicitacao_id,
  referencia_tipo: 'cotacao',
  data: ''
})

  // 3. Busca os dados da solicitação para montar o pedido
  const solicitacao = await getSolicitacaoById(solicitacao_id)

  // 4. Cria o pedido com status "aguardando_aprovacao" — 3ª pessoa vai autorizar
  const pedido = await createPedido({
    solicitacao_id,
    cotacao_id,
    fornecedor: cotacao.fornecedor,
    descricao_item: solicitacao.descricao,
    quantidade: solicitacao.quantidade,
    unidade: solicitacao.unidade,
    valor_unitario: solicitacao.quantidade > 0
      ? cotacao.valor / solicitacao.quantidade
      : cotacao.valor,
    valor_final: cotacao.valor,
    forma_pagamento: cotacao.forma_pagamento ?? 'a_vista',
    aprovado_por: usuario,
    data_aprovacao: new Date().toISOString().split('T')[0],
    observacoes: cotacao.condicoes || undefined,
    status: 'aguardando_aprovacao' as PedidoCompra['status'],
  })

  // 5. Atualiza solicitação para "em_cotacao" (ainda não aprovada — aguarda aprovação do pedido)
  await updateSolicitacaoStatus(solicitacao_id, 'em_cotacao', usuario)

  return { cotacao: cotacao as CotacaoFornecedor, pedido }
}

// ─── Desselecionar cotação → cancela o pedido vinculado ─────────────────────

export async function desselecionarCotacao(
  cotacao_id: string,
  solicitacao_id: string
): Promise<void> {
  // Desmarca a cotação
  await supabase
    .from('cotacoes_fornecedor')
    .update({ selecionada: false })
    .eq('id', cotacao_id)

  // Cancela o pedido vinculado a essa cotação (se existir e ainda não aprovado)
  await supabase
    .from('pedidos_compra')
    .update({ status: 'cancelado' })
    .eq('cotacao_id', cotacao_id)
    .in('status', ['aguardando_aprovacao', 'rascunho'])

  await registrarLog({
    acao: 'Cotação desmarcada',
    descricao: 'Pedido anterior cancelado para nova seleção',
    usuario: 'sistema',
    referencia_id: cotacao_id,
    referencia_tipo: 'cotacao',
    data: ''
  })
}

export async function deleteCotacao(id: string) {
  const { error } = await supabase
    .from('cotacoes_fornecedor')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Pedidos ────────────────────────────────────────────────────────────────

export async function getPedidos() {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PedidoCompra[]
}

export async function getPedidoById(id: string) {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as PedidoCompra
}

export async function createPedido(
  payload: Omit<PedidoCompra, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  await registrarLog({
    acao: 'Pedido gerado',
    descricao: `Pedido para ${payload.fornecedor} — R$ ${payload.valor_final.toLocaleString('pt-BR')}`,
    usuario: payload.aprovado_por,
    referencia_id: data.id,
    referencia_tipo: 'pedido',
    data: ''
  })
  return data as PedidoCompra
}

// ─── Autorizar pedido (3ª etapa) ─────────────────────────────────────────────

export async function autorizarPedido(
  pedido_id: string,
  autorizador: string
): Promise<{ pedido: PedidoCompra; entrega: Entrega }> {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .update({
      status: 'aprovado',
      aprovado_por: autorizador,
      data_aprovacao: new Date().toISOString().split('T')[0],
    })
    .eq('id', pedido_id)
    .select()
    .single()

  if (error) throw error

  await updateSolicitacaoStatus(data.solicitacao_id, 'aprovada', autorizador)

  const cotacao = data.cotacao_id
    ? await supabase.from('cotacoes_fornecedor').select('prazo_dias').eq('id', data.cotacao_id).single()
    : null
  const prazoDias = cotacao?.data?.prazo_dias ?? 7
  const dataPrevista = new Date()
  dataPrevista.setDate(dataPrevista.getDate() + prazoDias)

  const entrega = await createEntrega({
    pedido_id: data.id,
    fornecedor: data.fornecedor,
    descricao_item: data.descricao_item,
    data_prevista: dataPrevista.toISOString().split('T')[0],
    status: 'aguardando',
  })

  await registrarLog({
    acao: 'Compra autorizada',
    descricao: `${data.fornecedor} — R$ ${data.valor_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — entrega prevista em ${prazoDias} dias`,
    usuario: autorizador,
    referencia_id: pedido_id,
    referencia_tipo: 'pedido',
    data: ''
  })

  return { pedido: data as PedidoCompra, entrega }
}

// ─── Recusar pedido ───────────────────────────────────────────────────────────

export async function recusarPedido(
  pedido_id: string,
  usuario: string
): Promise<PedidoCompra> {
  // Busca o pedido para saber a cotacao_id e solicitacao_id
  const pedido = await getPedidoById(pedido_id)

  // Cancela o pedido
  const { data, error } = await supabase
    .from('pedidos_compra')
    .update({ status: 'cancelado' })
    .eq('id', pedido_id)
    .select()
    .single()

  if (error) throw error

  // Desmarca a cotação vinculada para o item voltar ao fluxo de cotações
  if (pedido.cotacao_id) {
    await supabase
      .from('cotacoes_fornecedor')
      .update({ selecionada: false })
      .eq('id', pedido.cotacao_id)
  }

  // Volta solicitação para "em_cotacao" para novo ciclo de seleção
  await updateSolicitacaoStatus(pedido.solicitacao_id, 'em_cotacao', usuario)

  await registrarLog({
    acao: 'Status alterado para em_cotacao',
    descricao: 'Solicitação movida para "em_cotacao"',
    usuario,
    referencia_id: pedido.solicitacao_id,
    referencia_tipo: 'solicitacao',
    data: ''
  })

  return data as PedidoCompra
}

export async function updatePedidoStatus(
  id: string,
  status: PedidoCompra['status'],
  usuario: string
) {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await registrarLog({
    acao: 'Compra recusada',
    descricao: `Pedido de ${data.fornecedor} recusado — devolvido para cotações`,
    usuario,
    referencia_id: id,
    referencia_tipo: 'pedido',
    data: ''
  })
  return data as PedidoCompra
}

// ─── Entregas ───────────────────────────────────────────────────────────────

export async function getEntregas(filtros?: FiltroEntregas) {
  let query = supabase
    .from('entregas')
    .select('*, pedidos_compra(fornecedor, descricao_item, valor_final)')
    .order('data_prevista', { ascending: true })

  if (filtros?.status && filtros.status !== 'todas') {
    query = query.eq('status', filtros.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Entrega[]
}

export async function confirmarEntrega(
  id: string,
  responsavel: string,
  nf_numero?: string
) {
  const { data, error } = await supabase
    .from('entregas')
    .update({
      status: 'entregue',
      data_real: new Date().toISOString().split('T')[0],
      responsavel_recebimento: responsavel,
      ...(nf_numero && { nf_numero }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await registrarLog({
    acao: 'Entrega confirmada',
    descricao: `"${data.descricao_item}" recebido de ${data.fornecedor}`,
    usuario: responsavel,
    referencia_id: id,
    referencia_tipo: 'entrega',
    data: ''
  })

  return data as Entrega
}

export async function marcarEntregaAtrasada(id: string) {
  const { data, error } = await supabase
    .from('entregas')
    .update({ status: 'atrasado' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Entrega
}

// ─── Fornecedores ───────────────────────────────────────────────────────────

export async function getFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('nome', { ascending: true })

  if (error) throw error

  return (data ?? []).map((f: Record<string, unknown>) => ({
    id: String(f.id ?? ''),
    nome: String(f.nome || f.razao_social || ''),
    razao_social: f.razao_social ? String(f.razao_social) : undefined,
    cnpj: f.cnpj ? String(f.cnpj) : undefined,
    categoria: f.categoria ? String(f.categoria) : undefined,
    status: f.status ? String(f.status) : undefined,
    endereco: f.endereco ? String(f.endereco) : undefined,
    contato: f.contato_nome ? String(f.contato_nome) : undefined,
    telefone: f.telefone ? String(f.telefone) : undefined,
    email: f.email ? String(f.email) : undefined,
    avaliacao: f.avaliacao != null ? Number(f.avaliacao) : undefined,
    cidade: f.cidade ? String(f.cidade) : undefined,
    estado: f.estado ? String(f.estado) : undefined,
    observacoes: f.observacoes ? String(f.observacoes) : undefined,
    total_pedidos: f.total_pedidos != null ? Number(f.total_pedidos) : undefined,
    percentual_pontualidade: f.percentual_pontualidade != null ? Number(f.percentual_pontualidade) : undefined,
    ativo: f.status ? String(f.status).toLowerCase() === 'ativo' : f.ativo !== false,
    created_at: f.created_at ? String(f.created_at) : undefined,
  }))
}

export async function createFornecedor(
  payload: Omit<Fornecedor, 'id' | 'created_at' | 'total_pedidos' | 'percentual_pontualidade'>
) {
  const { data, error } = await supabase
    .from('fornecedores')
    .insert([{ ...payload, total_pedidos: 0, percentual_pontualidade: 0 }])
    .select()
    .single()

  if (error) throw error
  return data as Fornecedor
}

export async function updateFornecedor(
  id: string,
  payload: Partial<Fornecedor>
) {
  const { data, error } = await supabase
    .from('fornecedores')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Fornecedor
}

// ─── Auditoria ──────────────────────────────────────────────────────────────

export async function getAuditoriaLogs(limite = 50) {
  const { data, error } = await supabase
    .from('auditoria_compras')
    .select('*')
    .order('data', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data as AuditoriaLog[]
}

export async function registrarLog(
  payload: Omit<AuditoriaLog, 'id'>
) {
  const { error } = await supabase
    .from('auditoria_compras')
    .insert([{
      ...payload,
      data: payload.data || new Date().toISOString(),
    }])

  if (error) console.error('Erro ao registrar log:', error)
}

// ─── Métricas ───────────────────────────────────────────────────────────────

export async function getMetricasCompras(): Promise<MetricasCompras> {
  const [solicitacoes, entregas, pedidos] = await Promise.all([
    supabase.from('solicitacoes_compra').select('status, created_at'),
    supabase.from('entregas').select('status, data_prevista'),
    supabase.from('pedidos_compra').select('valor_final, created_at').eq('status', 'aprovado'),
  ])

  if (solicitacoes.error) throw solicitacoes.error
  if (entregas.error) throw entregas.error
  if (pedidos.error) throw pedidos.error

  const pendentes = solicitacoes.data.filter(s => s.status === 'pendente').length
  const atrasadas = entregas.data.filter(e => e.status === 'atrasado').length
  const totalComprado = pedidos.data.reduce((acc, p) => acc + (p.valor_final ?? 0), 0)

  const semanaAtras = new Date()
  semanaAtras.setDate(semanaAtras.getDate() - 7)
  const novasSemana = solicitacoes.data.filter(
    s => new Date(s.created_at) > semanaAtras
  ).length

  return {
    total_comprado: totalComprado,
    economia_cotacoes: totalComprado * 0.08,
    solicitacoes_pendentes: pendentes,
    entregas_atrasadas: atrasadas,
    variacao_total_pct: 12,
    variacao_economia_pct: 7.4,
    solicitacoes_novas_semana: novasSemana,
    entregas_atrasadas_variacao: -2,
  }
}

// ─── Criar entrega ───────────────────────────────────────────────────────────

export async function createEntrega(
  payload: Omit<Entrega, 'id'>
) {
  const { data, error } = await supabase
    .from('entregas')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data as Entrega
}