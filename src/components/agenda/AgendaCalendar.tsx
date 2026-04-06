'use client'

import { useState, useRef, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react'
import { Compromisso } from '@/types/agenda'
import { AgendaDayModal } from './AgendaDayModal'

export function AgendaCalendar({ data, onUpdate, userId }: any) {
  const today = new Date()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEventos, setSelectedEventos] = useState<Compromisso[]>([])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [openMonth, setOpenMonth] = useState(false)
  const [openYear, setOpenYear] = useState(false)

  const months = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ]

  const years = Array.from({ length: 20 }, (_, i) => 2015 + i)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const yearRef = useRef<HTMLDivElement | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  function getEventos(dia: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return data.filter((e: { date: string }) => e.date === dateStr)
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

function handleUpdate(updated: Compromisso) {
  if (onUpdate) onUpdate(updated)

  setSelectedEventos(prev =>
    prev.map(item =>
      item.id === updated.id ? updated : item
    )
  )
}

  useEffect(() => {
  if (openYear && yearRef.current) {
    const active = yearRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ block: 'center' })
    }
  }
}, [openYear])

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setOpenMonth(false)
      setOpenYear(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [])



  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">

      {/* HEADER */}
      <div className="relative flex items-center justify-between mb-4">

        {/* SETA ESQUERDA */}
        <button
          onClick={prevMonth}
          className="z-10 text-gray-400 hover:text-white"
        >
          ←
        </button>

        {/* TÍTULO CENTRALIZADO + DROPDOWNS */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div ref={dropdownRef} className="relative text-lg font-semibold flex items-center gap-2">

            {/* MÊS */}
            <span
              onClick={(e) => {
                e.stopPropagation()
                setOpenMonth(!openMonth)
                setOpenYear(false)
              }}
              className="cursor-pointer hover:text-blue-400"
            >
              {months[currentDate.getMonth()]}
            </span>

            <span className="text-gray-400">de</span>

            {/* ANO */}
            <span
              onClick={(e) => {
                e.stopPropagation()
                setOpenYear(!openYear)
                setOpenMonth(false)
              }}
              className="cursor-pointer hover:text-blue-400"
            >
              {currentDate.getFullYear()}
            </span>

            {/* DROPDOWN MÊS */}
            {openMonth && (
              <div  onClick={(e) => e.stopPropagation()} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#111] border border-gray-700 rounded-xl p-4 grid grid-cols-3 gap-3 z-50 w-[320px]">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(index)
                      setCurrentDate(newDate)
                      setOpenMonth(false)
                    }}
                    className="hover:bg-gray-800 px-2 py-1 rounded text-sm w-full"
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            {/* DROPDOWN ANO */}
            {openYear && (
              <div ref={yearRef}  onClick={(e) => e.stopPropagation()} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#111] border border-gray-700 rounded-xl p-4 grid grid-cols-1 gap-3 z-50 w-[320px] max-h-[200px] overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    data-active={year === currentDate.getFullYear()}
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setFullYear(year)
                      setCurrentDate(newDate)
                      setOpenYear(false)
                    }}
                    className="hover:bg-gray-800 px-2 py-1 rounded text-sm w-full"
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* SETA DIREITA */}
        <button
          onClick={nextMonth}
          className="z-10 text-gray-400 hover:text-white"
        >
          →
        </button>

      </div>

      {/* DIAS DA SEMANA */}
      <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((dia, index) => {
          if (!dia) return <div key={index}></div>

          const eventos = getEventos(dia)

          return (
            <div
              key={index}
              onClick={() => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

                setSelectedDate(dateStr)
                setSelectedEventos(eventos)
              }}
              className="cursor-pointer min-h-[90px] bg-black/30 rounded-lg p-2 border border-white/5 hover:border-white/20 transition"
            >
              <div className="text-xs text-gray-400 mb-1">
                {dia}
              </div>

              <div className="space-y-1">
                {eventos.slice(0, 2).map((e: { id: Key | null | undefined; status: string; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
                  <div
                    key={e.id}
                    className={`text-[10px] px-1 py-[2px] rounded ${
                      e.status === 'pendente'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {e.title}
                  </div>
                ))}

                {eventos.length > 2 && (
                  <div className="text-[10px] text-gray-500">
                    +{eventos.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL */}
      {selectedDate && (
          <AgendaDayModal
            date={selectedDate}
            eventos={selectedEventos}
            onClose={() => setSelectedDate(null)}
            onUpdate={handleUpdate}
            userId={userId}
          />
      )}
    </div>
  )
}