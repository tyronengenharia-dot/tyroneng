import type { DocumentStatus } from '@/types/acervo'

export function daysTo(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - hoje.getTime()) / 86_400_000)
}

export function calcDocumentStatus(
  expiresAt?: string,
  diasRenovar: number = 0
): DocumentStatus {
  if (!expiresAt) return 'valid'
  const dias = daysTo(expiresAt)
  if (dias === null) return 'valid'
  if (dias < 0) return 'expired'
  const limiar = Math.max(diasRenovar, 7) + 7
  if (dias <= limiar) return 'expiring'
  return 'valid'
}

export interface ExpiryInfo {
  text: string
  level: 'danger' | 'warn' | 'normal' | null
}

export function getExpiryDisplay(
  expiresAt?: string,
  diasRenovar: number = 0
): ExpiryInfo | null {
  if (!expiresAt) return null

  const dias = daysTo(expiresAt)
  if (dias === null) return null

  if (dias < 0)
    return {
      text: `Venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`,
      level: 'danger',
    }

  if (dias <= diasRenovar)
    return {
      text: `⚡ Renovar urgente — leva ${diasRenovar} dias e vence em ${dias}`,
      level: 'danger',
    }

  if (dias <= diasRenovar + 7)
    return {
      text: `⚠️ Prazo apertado — vence em ${dias} dias`,
      level: 'warn',
    }

  if (dias <= 30)
    return { text: `Vence em ${dias} dias`, level: 'warn' }

  const d = new Date(expiresAt + 'T00:00:00')
  return {
    text: `Vence: ${d.toLocaleDateString('pt-BR')}`,
    level: 'normal',
  }
}

export function getAlertMessage(
  expiresAt: string,
  diasRenovar: number
): string | null {
  const dias = daysTo(expiresAt)
  if (dias === null) return null

  if (dias < 0)
    return `Documento já vencido há ${Math.abs(dias)} dias. Solicite a renovação imediatamente.`

  if (dias <= diasRenovar)
    return `Atenção: o prazo de emissão é ${diasRenovar} dias, mas restam apenas ${dias} dias. Não há tempo hábil.`

  if (dias <= diasRenovar + 7)
    return `Prazo apertado — o órgão leva ${diasRenovar} dias e faltam ${dias} dias para vencer. Providencie já.`

  return null
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}
