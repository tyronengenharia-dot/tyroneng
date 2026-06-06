'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { ComparacaoObra } from '@/types/comparacao'

interface Props {
  obras: ComparacaoObra[]
  obraA: string | null
  setObraA: Dispatch<SetStateAction<string | null>>
  obraB: string | null
  setObraB: Dispatch<SetStateAction<string | null>>
}

export function ComparacaoSelector({
  obras,
  obraA,
  setObraA,
  obraB,
  setObraB,
}: Props) {
  return (
    <div>...</div>
  )
}