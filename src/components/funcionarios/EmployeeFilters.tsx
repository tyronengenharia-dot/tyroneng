'use client'

export function EmployeeFilters({ status, setStatus }: any) {
  return (
    <div className="flex gap-2">
      {['todos', 'ativo', 'inativo'].map(item => (
        <button
          key={item}
          onClick={() => setStatus(item)}
          className={`px-3 py-1 rounded-xl text-sm ${
            status === item
              ? 'bg-white text-black'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}