'use client'

import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import DocumentCard from '@/components/acervo/DocumentCard'
import DocumentModal from '@/components/acervo/modals/DocumentModal'
import type {
  AcervoDocument,
  DocumentStatus,
  DocumentCategory,
  DocumentFormData,
} from '@/types/acervo'
import { createDocument } from '@/services/acervoService'
import { STATUS_FILTERS, DOCUMENT_CATEGORIES } from '@/lib/constants'

interface CompanyAcervoSectionProps {
  initialDocuments: AcervoDocument[]
}

export default function CompanyAcervoSection({
  initialDocuments,
}: CompanyAcervoSectionProps) {
  const [docs, setDocs] = useState<AcervoDocument[]>(initialDocuments)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  async function handleSave(formData: DocumentFormData) {
    setSaving(true)
    try {
      const doc = await createDocument(formData, { type: 'company' })
      setDocs((prev) => [doc, ...prev])
      setShowModal(false)
    } catch (err: any) {
      alert(err.message ?? 'Erro ao salvar documento')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(docId: string) {
    setDocs((prev) => prev.filter((d) => d.id !== docId))
  }

  const filtered = docs.filter((d) => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchCat = categoryFilter === 'all' || d.category === categoryFilter
    const matchSearch =
      !search || d.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c8f65d]/10 border border-[#c8f65d]/20 flex items-center justify-center">
            <Building2 size={18} className="text-[#c8f65d]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Documentos da Empresa
            </h2>
            <p className="text-xs text-zinc-500">
              {docs.length} documentos cadastrados
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c8f65d] text-black text-sm font-semibold rounded-xl hover:bg-[#d4f97a] transition"
        >
          <Plus size={15} />
          Novo Documento
        </button>
      </div>

      {/* Filtros de status */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as DocumentStatus | 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === f.value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Busca + categorias */}
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-zinc-500 w-52 placeholder-zinc-600"
          />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                categoryFilter === 'all'
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Todas
            </button>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  categoryFilter === cat
                    ? 'bg-zinc-600 text-white'
                    : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-sm">Nenhum documento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <DocumentModal
          title="Novo Documento da Empresa"
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          loading={saving}
        />
      )}
    </section>
  )
}
