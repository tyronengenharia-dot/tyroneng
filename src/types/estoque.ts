export type Material = {
  id: string
  nome: string
  unidade: string
  quantidade: number
  valor_unitario: number
  created_at?: string
}

export type Equipamento = {
  id: string
  nome: string
  numero_serie: string
  categoria: string
  status: 'disponivel' | 'em_uso' | 'manutencao'
  localizacao?: string
  responsavel?: string
  valor?: number
  created_at?: string
}

export type Maquinario = {
  id: string
  nome: string
  tipo: string
  modelo: string
  fabricante?: string
  ano?: number
  horimetro: number
  custo_hora?: number
  status: 'ativo' | 'em_uso' | 'manutencao' | 'parado'
  localizacao?: string
  obra_id?: string
  observacoes?: string
  created_at?: string
}

export type Veiculo = {
  id: string
  nome: string
  placa: string
  modelo: string
  ano: number
  km: number
  status: 'ativo' | 'manutencao' | 'inativo'
  observacoes?: string
  created_at?: string
}

export type EstoqueStats = {
  totalAtivos: number
  valorTotal: number
  emManutencao: number
  totalVeiculos: number
}