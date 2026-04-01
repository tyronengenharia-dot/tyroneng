'use client'

import { ChecklistItemRow } from './ChecklistItemRow'

export function ChecklistTable({ items, setItems }: any) {
  function toggleStatus(index: number) {
    const updated = [...items]

    updated[index].status =
      updated[index].status === 'concluido'
        ? 'pendente'
        : 'concluido'

    setItems(updated)
  }

  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <ChecklistItemRow
          key={item.id}
          item={item}
          onToggle={() => toggleStatus(i)}
        />
      ))}
    </div>
  )
}