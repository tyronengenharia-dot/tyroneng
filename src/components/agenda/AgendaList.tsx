'use client'

import { useState } from 'react'
import { Compromisso } from '@/types/agenda'
import { AgendaModal } from './AgendaModal'

export function AgendaList({ data, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<Compromisso | null>(null)

  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
        <p className="text-gray-400">Sem compromissos</p>
      </div>
    )
  }

  // 🔥 AGRUPAR POR DATA
  const grouped = data.reduce((acc: any, item: Compromisso) => {
    if (!acc[item.date]) {
      acc[item.date] = []
    }
    acc[item.date].push(item)
    return acc
  }, {})

  // 🔥 ORDENAR DATAS
  const sortedDates = Object.keys(grouped).sort()

  // ✅ FORMATAR DATA SEM BUG DE TIMEZONE
  function formatDate(date: string) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <>
      <div className="space-y-6">
        {sortedDates.map(date => (
          <div key={date}>

            {/* HEADER DO DIA */}
            <div className="mb-2">
              <p className="text-sm text-gray-400">
                📅 {formatDate(date)}
              </p>
            </div>

            {/* EVENTOS DO DIA */}
            <div className="space-y-3">
              {grouped[date]
                .sort((a: Compromisso, b: Compromisso) =>
                  a.time.localeCompare(b.time)
                )
                .map((item: Compromisso) => (
                  <div
                    key={item.id}
                    className="bg-[#111] p-4 rounded-2xl border border-white/10 flex justify-between items-center hover:border-white/20 transition"
                  >
                    {/* EDITAR */}
                    <div
                      onClick={() => setEditing(item)}
                      className="cursor-pointer"
                    >
                      <h3 className="text-white font-medium">
                        {item.title}
                      </h3>

                      <p className="text-gray-400 text-sm">
                        {item.time}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

                      {/* STATUS CLICK */}
                      <button
                        onClick={() =>
                          onUpdate({
                            ...item,
                            status:
                              item.status === 'pendente'
                                ? 'concluido'
                                : 'pendente',
                          })
                        }
                        className={`text-xs px-2 py-1 rounded-lg ${
                          item.status === 'pendente'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {item.status}
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-400 text-xs hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {editing && (
      <AgendaModal
        initialData={editing}
        onClose={() => setEditing(null)}
        onSaved={onUpdate}
        onDeleted={onDelete}   // ← adicionar isso
      />
      )}
    </>
  )
}