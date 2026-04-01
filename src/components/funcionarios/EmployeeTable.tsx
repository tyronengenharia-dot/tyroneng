import { Employee } from '@/types/employee'
import { supabase } from '@/lib/supabaseClient'

export function EmployeeTable({ data, onEdit, onUpdate, onEditCosts }: any) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 p-10 rounded-2xl text-center">
        <p className="text-gray-400">Nenhum funcionário encontrado</p>
      </div>
    )
  }

  function formatCurrency(value: number) {
    if (!value) return 'R$ 0,00'

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value))
  }

  async function toggleStatus(emp: Employee) {
    await supabase
      .from('funcionarios')
      .update({
        status: emp.status === 'ativo' ? 'inativo' : 'ativo',
      })
      .eq('id', emp.id)

    onUpdate()
  }

  async function deleteEmployee(id: string) {
    const confirmDelete = confirm('Tem certeza que deseja excluir?')
    if (!confirmDelete) return

    await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id)

    onUpdate()
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Nome</th>
            <th className="text-left">Cargo</th>
            <th className="text-left">Salário</th>
            <th className="text-left">Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: Employee) => (
            <tr
              key={item.id}
              className="border-t border-white/10 hover:bg-white/5"
            >
              <td className="p-4 font-medium text-white">{item.nome}</td>
              <td className="p-4">{item.cargo}</td>
              <td className="p-4">
                {formatCurrency(Number(item.salario))}
              </td>

              <td className="p-4">
                <button
                  onClick={() => toggleStatus(item)}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    item.status === 'ativo'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {item.status}
                </button>
              </td>

              <td>
                <div className="flex gap-2 justify-end p-4">
                  <button
                    onClick={() => onEditCosts(item)}
                    className="text-yellow-400 hover:underline"
                  >
                    Custos
                  </button>

                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-400 hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deleteEmployee(item.id)}
                    className="text-red-400 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}