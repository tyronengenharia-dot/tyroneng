export function getStatus(dataValidade?: string) {
  if (!dataValidade) return 'sem_validade'

  const hoje = new Date()
  const validade = new Date(dataValidade)

  const diff =
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)

  if (diff < 0) return 'vencido'
  if (diff <= 7) return 'urgente'
  if (diff <= 30) return 'atencao'

  return 'valido'
}