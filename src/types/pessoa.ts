export type PessoaCategoria = 'funcionario' | 'cliente' | 'fornecedor' | 'autoridade' | 'pessoa_proxima'

export type Funcionario = {
  id: string
  nome: string
  cargo: string
  departamento?: string
  salario: number
  status: 'ativo' | 'inativo' | 'ferias' | 'afastado'
  telefone?: string
  email?: string
  cpf?: string
  data_admissao?: string
  data_nascimento?: string
  endereco?: string
  foto_url?: string
  extras?: number
  custo_total?: number
  created_at: string
}

export type Cliente = {
  id: string
  nome: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  empresa?: string
  cnpj_cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  status: 'ativo' | 'inativo' | 'prospecto' | 'ex_cliente'
  origem?: string
  observacoes?: string
  created_at: string
}

export type Fornecedor = {
  id: string
  nome: string
  razao_social?: string
  cnpj?: string
  categoria: string
  email?: string
  telefone?: string
  contato_nome?: string
  endereco?: string
  cidade?: string
  estado?: string
  status: 'ativo' | 'inativo' | 'homologado' | 'suspenso'
  avaliacao?: number
  observacoes?: string
  created_at: string
}

export type Autoridade = {
  id: string
  nome: string
  orgao: string
  cargo: string
  jurisdicao?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export type PessoaProxima = {
  id: string
  nome: string
  relacao: string
  empresa?: string
  cargo?: string
  telefone?: string
  email?: string
  area?: string
  como_conheceu?: string
  observacoes?: string
  status: 'ativo' | 'inativo'
  created_at: string
}
