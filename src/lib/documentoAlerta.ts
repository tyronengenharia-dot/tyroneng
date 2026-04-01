export function getAlerta(doc: any) {
  if (!doc.data_validade) return null

  const hoje = new Date()
  const validade = new Date(doc.data_validade)

  const diasRestantes =
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)

  const dias = Math.ceil(diasRestantes)
  const tempo = doc.tempo_emissao_dias || 0

  // 🔴 VENCIDO
  if (dias < 0) {
    return {
      tipo: 'vencido',
      mensagem: `Venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`,
    }
  }

  // 🚨 CRÍTICO (não dá tempo)
  if (dias <= tempo) {
    return {
      tipo: 'critico',
      mensagem: `Leva ${tempo} dias e vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
    }
  }

  // 🟠 RISCO (antecipação)
  if (dias <= tempo + 7) {
    return {
      tipo: 'risco',
      mensagem: `Atenção: prazo apertado (vence em ${dias} dias)`,
    }
  }

  // 🟡 ATENÇÃO
  if (dias <= 15) {
    return {
      tipo: 'atencao',
      mensagem: `Vence em ${dias} dias`,
    }
  }

  return null
}