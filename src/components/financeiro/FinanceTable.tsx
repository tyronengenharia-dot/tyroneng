import { deleteFinancialRecord } from '@/services/financialService'
import { FinancialRecord } from '@/types/financial'
import { toast } from 'sonner'

async function handleDelete(id: string) {
  toast('Deseja excluir?', {
    action: {
      label: 'Excluir',
      onClick: async () => {
        await deleteFinancialRecord(id)
        toast.success('Excluído com sucesso')
        fetchData()
      },
    },
  })
}

type Props = {
  data: FinancialRecord[]
  onEdit: (item: FinancialRecord) => void
  onDelete: (id: string) => void
}

export function FinanceTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
        Nenhuma transação encontrada
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4">Descrição</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map(item => (
            <tr key={item.id} className="border-t">
             <td className="font-medium">{item.description}</td>
            <td>
              <span
                className={`px-2 py-1 rounded-lg text-xs ${
                  item.type === 'entrada'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {item.type}
              </span>
            </td>

            <td className="font-semibold">
              <span
                className={
                  item.type === 'entrada'
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                R$ {item.value}
              </span>
            </td>
              <td>{item.status}</td>
              <td>{item.date}</td>

              <td className="flex gap-2 p-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-500"
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-500"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fetchData() {
  throw new Error('Function not implemented.')
}
