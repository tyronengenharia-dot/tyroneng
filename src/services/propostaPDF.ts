import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { Proposta } from '@/types/proposta'

const execAsync = promisify(exec)

// Caminho do script Python — ajuste conforme seu deploy
// Em produção: coloque generate_proposta.py em /app/scripts/ ou similar
const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts', 'generate_proposta.py')
const PYTHON_BIN = process.env.PYTHON_BIN ?? 'python3'

export interface GerarPropostaOptions {
  /** Se true, destaca os campos editáveis em amarelo */
  highlight?: boolean
}

/**
 * Converte o objeto Proposta nos campos esperados pelo gerador Python.
 */
function propostaToPayload(p: Proposta): Record<string, unknown> {
  return {
    numero: p.numero,
    cliente: p.cliente,
    obra: p.obra,
    titulo_capa: p.obra.toUpperCase(),
    descricao: p.descricao,
    objetivo: p.descricao,
    etapas: p.etapas ?? [],
    entregaveis: [
      'PROJETO ESTRUTURAL',
      `SERVIÇO: ${p.obra.toUpperCase()}`,
      'ART - CREA/RJ',
    ],
    valor: p.valor,
    valor_extenso: '', // opcional — pode implementar conversão numérica
    prazoExecucao: p.prazoExecucao,
    validade: p.validade,
    area_execucao: '—',
    responsavel: p.responsavel,
    crea: p.crea ?? 'CREA/RJ 2019103029',
    condicoesPagamento: p.condicoesPagamento ?? '',
    descricao_nf: p.descricao?.toUpperCase() ?? '',
    data_emissao: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(p.createdAt)),
  }
}

/**
 * Gera o PDF da proposta e retorna o buffer.
 * Usa um arquivo temporário para intermediar Python ↔ Node.
 */
export async function gerarPropostaPDF(
  proposta: Proposta,
  options: GerarPropostaOptions = {}
): Promise<Buffer> {
  const { highlight = false } = options
  const payload = propostaToPayload(proposta)

  const tmpOut = path.join(tmpdir(), `proposta_${proposta.id}_${Date.now()}.pdf`)

  try {
    const jsonArg = JSON.stringify(JSON.stringify(payload))
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "'\\''")

    const cmd = `${PYTHON_BIN} "${PYTHON_SCRIPT}" '${JSON.stringify(payload)}' "${tmpOut}" ${highlight}`
    await execAsync(cmd)

    const buffer = await readFile(tmpOut)
    return buffer
  } finally {
    await unlink(tmpOut).catch(() => {})
  }
}

/**
 * Nome sugerido para download do PDF.
 */
export function propostaPDFFilename(proposta: Proposta): string {
  const cliente = proposta.cliente.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
  return `Proposta_${proposta.numero}_${cliente}.pdf`
}
