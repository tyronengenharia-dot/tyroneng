export type Material = {
  id: string
  nome: string
  unidade: string
  quantidade: number
  valor_unitario: number
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
}