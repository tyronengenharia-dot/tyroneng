'use client'

import { useEffect, useState } from 'react'
import { getAgenda } from '@/services/agenda'
import { Compromisso } from '@/types/agenda'

import { AgendaList } from '@/components/agenda/AgendaList'
import { AgendaFilters } from '@/components/agenda/AgendaFilters'
import { AgendaModal } from '@/components/agenda/AgendaModal'
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar'
import { AgendaContatos } from '@/components/agenda/AgendaContato'
import { supabase } from '@/lib/supabaseClient'


export default function AgendaPage() {
  const [data, setData] = useState<Compromisso[]>([])
  const [status, setStatus] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [openContatos, setOpenContatos] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let id = localStorage.getItem('user_id')

    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('user_id', id)
    }

    setUserId(id)
  }, [])

  async function load() {
    if (!userId) return

    const result = await getAgenda(userId)

    const formatted = result.map((item: any) => {
      const data = new Date(item.data)

      return {
        ...item,
        title: item.titulo,
        date: data.toISOString().split('T')[0],
        time: data.toTimeString().slice(0, 5),
      }
    })

    setData(formatted)
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('agenda-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agenda',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const item = (payload.new || payload.old) as any
          if (!item) return

          const data = new Date(item.data)

          const formatted = {
            ...item,
            title: item.titulo,
            date: data.toISOString().split('T')[0],
            time: data.toTimeString().slice(0, 5),
          }

          setData(prev => {
            if (payload.eventType === 'INSERT') return [...prev, formatted]
            if (payload.eventType === 'UPDATE') return prev.map(i => i.id === formatted.id ? formatted : i)
            if (payload.eventType === 'DELETE') return prev.filter(i => i.id !== payload.old.id)
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const filteredData =
    status === 'todos'
      ? data
      : data.filter(i => i.status === status)

  useEffect(() => {
    if (userId) load()
  }, [userId])

  function handleUpdate(updated: any) {
    const data = new Date(updated.data)

    const formatted = {
      ...updated,
      title: updated.titulo,
      date: data.toISOString().split('T')[0],
      time: data.toTimeString().slice(0, 5),
    }

    setData(prev => prev.map(item => item.id === formatted.id ? formatted : item))
  }

  function handleDelete(id: string) {
    setData(prev => prev.filter(item => item.id !== id))
  }

  function sortAgenda(data: Compromisso[]) {
    return [...data].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-gray-400 text-sm">Controle de compromissos</p>
        </div>

        <div className="flex items-center gap-2">
          {/* botão gerenciar */}
          <button
            onClick={() => setOpenContatos(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 13c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M13 9v4M11 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Gerenciar
          </button>

          {/* botão novo */}
          <button
            onClick={() => setOpenModal(true)}
            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
          >
            + Novo
          </button>
        </div>
      </div>

      <AgendaCalendar
        data={data}
        onUpdate={handleUpdate}
        userId={userId}
      />

      <AgendaFilters status={status} setStatus={setStatus} />

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <AgendaList
          data={sortAgenda(filteredData)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {openModal && userId && (
        <AgendaModal
          userId={userId}
          onClose={() => setOpenModal(false)}
          onSaved={(novoEvento: any) => {
            const data = new Date(novoEvento.data)
            const formatted = {
              ...novoEvento,
              title: novoEvento.titulo,
              date: data.toISOString().split('T')[0],
              time: data.toTimeString().slice(0, 5),
            }
            setData(prev => {
              const existe = prev.find(i => i.id === formatted.id)
              if (existe) return prev.map(i => i.id === formatted.id ? formatted : i)
              return [...prev, formatted]
            })
          }}
        />
      )}

      {openContatos && userId && (
        <AgendaContatos
          userId={userId}
          onClose={() => setOpenContatos(false)}
        />
      )}

    </div>
  )
}