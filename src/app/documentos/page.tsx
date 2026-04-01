'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { CategoriaCard } from '@/components/documentos/DocumentoCard'
import { CategoriaModal } from '@/components/documentos/CategoriaModal'

export default function Page() {
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)

  async function fetchData() {
    try {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return

      const { data: categoriasData } = await supabase
        .from('categorias_documentos')
        .select('*')
        .eq('user_id', userId)

      const { data: documentosData } = await supabase
        .from('documentos')
        .select('*')
        .eq('user_id', userId)

      const categoriasComDocs = (categoriasData || []).map(cat => ({
        ...cat,
        documentos: (documentosData || []).filter(
          doc => doc.categoria_id === cat.id
        )
      }))

      setCategorias(categoriasComDocs)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

const allDocs = categorias.flatMap(cat => cat.documentos || [])

const calcStatus = (doc: any) => {
  if (!doc.tem_validade || !doc.data_validade) return 'ok'
  const dias = Math.ceil(
    (new Date(doc.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const diasRenovacao = Math.max(doc.dias_renovacao || 0, 7)
  if (dias < 0) return 'vencido'
  if (dias <= diasRenovacao) return 'renovar'
  return 'ok'
}

const vencidos = allDocs.filter(d => calcStatus(d) === 'vencido').length
const renovar  = allDocs.filter(d => calcStatus(d) === 'renovar').length
const ok       = allDocs.filter(d => calcStatus(d) === 'ok').length
const total    = allDocs.length

  if (loading) return <div className="p-10">Carregando...</div>

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Documentos</h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-yellow-500 text-black px-4 py-2 rounded-xl"
        >
          + Nova Categoria
        </button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-4 gap-4">

        <div className="bg-red-500/10 p-4 rounded-xl">
          <p className="text-red-400 text-xs">VENCIDOS</p>
          <p className="text-xl font-bold">{vencidos}</p>
        </div>

        <div className="bg-yellow-500/10 p-4 rounded-xl">
          <p className="text-yellow-400 text-xs">RENOVAR JÁ</p>
          <p className="text-xl font-bold">{renovar}</p>
        </div>

        <div className="bg-green-500/10 p-4 rounded-xl">
          <p className="text-green-400 text-xs">OK</p>
          <p className="text-xl font-bold">{ok}</p>
        </div>

        <div className="bg-white/5 p-4 rounded-xl">
          <p className="text-white/50 text-xs">TOTAL</p>
          <p className="text-xl font-bold">{total}</p>
        </div>

      </div>

      {/* LISTA */}
      {categorias.map(cat => (
        <CategoriaCard
          key={cat.id}
          categoria={cat}
          onUpdate={fetchData}
        />
      ))}

      {/* MODAL */}
      {openModal && (
        <CategoriaModal
          onClose={() => setOpenModal(false)}
          onSave={fetchData}
        />
      )}

    </div>
  )
}