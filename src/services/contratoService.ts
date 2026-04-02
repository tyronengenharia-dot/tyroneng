import { Contrato } from '@/types/contrato'

export async function getContratos(): Promise<Contrato[]> {
  return [
    {
      id: '1',
      name: 'Contrato Escola Municipal',
      client: 'Prefeitura de São Paulo',
      client_email: 'contatos@prefeitura.sp.gov.br',
      client_cnpj: '43.776.098/0001-09',
      value: 240000,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'ativo',
      description: 'Fornecimento de serviços educacionais para rede municipal.',
      created_at: '2025-12-15',
      tags: ['governo', 'educação'],
    },
    {
      id: '2',
      name: 'Contrato Hospital Regional',
      client: 'Governo do Estado',
      client_email: 'licitacoes@estado.gov.br',
      client_cnpj: '28.152.olean/0001-30',
      value: 580000,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      status: 'finalizado',
      description: 'Gestão de sistemas de saúde hospitalar.',
      created_at: '2024-12-01',
      tags: ['saúde', 'governo'],
    },
    {
      id: '3',
      name: 'Plataforma SaaS Logística',
      client: 'TransBrasil Ltda.',
      client_email: 'ti@transbrasil.com.br',
      client_cnpj: '10.203.405/0001-55',
      value: 96000,
      start_date: '2026-03-01',
      end_date: '2026-08-31',
      status: 'pendente',
      description: 'Implementação de plataforma de rastreamento logístico.',
      created_at: '2026-02-10',
      tags: ['tecnologia', 'logística'],
    },
    {
      id: '4',
      name: 'Suporte TI Anual',
      client: 'Banco Meridional S.A.',
      client_email: 'contratos@meridional.com.br',
      client_cnpj: '60.872.504/0001-77',
      value: 144000,
      start_date: '2025-06-01',
      end_date: '2026-05-31',
      status: 'ativo',
      description: 'Contrato de suporte técnico e manutenção de infraestrutura.',
      created_at: '2025-05-20',
      tags: ['financeiro', 'TI'],
    },
    {
      id: '5',
      name: 'Consultoria Estratégica',
      client: 'Grupo Alvorada',
      client_email: 'juridico@alvorada.com.br',
      client_cnpj: '33.491.228/0001-14',
      value: 72000,
      start_date: '2024-07-01',
      end_date: '2024-12-31',
      status: 'cancelado',
      description: 'Projeto de consultoria estratégica e reestruturação organizacional.',
      created_at: '2024-06-15',
      tags: ['consultoria'],
    },
  ]
}

export function formatCurrency(value?: number): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function getDaysUntilEnd(end_date: string): number {
  const today = new Date()
  const end = new Date(end_date)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
