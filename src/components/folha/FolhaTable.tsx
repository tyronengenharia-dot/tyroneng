import { supabase } from '@/lib/supabaseClient'

export function FolhaTable({ data, onUpdate, onOpenAdjust }: any) {

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  async function togglePago(item: any) {
    await supabase
      .from('folha_mensal')
      .update({ pago: !item.pago })
      .eq('id', item.id)

    onUpdate()
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Funcionário</th>
            <th className="text-right">Base</th>
            <th className="text-right">Extras</th>
            <th className="text-center">Ajustes</th>
            <th className="text-right">Total</th>
            <th className="text-center">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any) => {
            const adicional = Number(item.adicional || 0)
            const desconto = Number(item.desconto || 0)
            const isLocked = item.fechado === true

            const total =
              Number(item.salario_base) +
              Number(item.extras) +
              adicional -
              desconto

            return (
              <tr
                key={item.id}
                className={`border-t border-white/10 ${
                  isLocked ? 'opacity-50' : 'hover:bg-white/5'
                }`}
              >
                <td className="p-4 text-white">
                  {item.funcionarios?.nome}
                </td>

                <td className="p-4 text-right">
                  {formatCurrency(item.salario_base)}
                </td>

                <td className="p-4 text-right text-yellow-400">
                  {formatCurrency(item.extras)}
                </td>

                {/* 🔥 BOTÃO AJUSTE */}
                <td className="p-4 text-center">
                  <button
                    onClick={() => onOpenAdjust(item)}
                    disabled={isLocked}
                    className="text-blue-400 hover:underline disabled:opacity-50"
                  >
                    Ajustar
                  </button>
                </td>

                <td className="p-4 text-right font-semibold">
                  {formatCurrency(total)}
                </td>

                {/* 🔥 STATUS */}
                <td className="p-4 text-center">
                  <button
                    onClick={() => togglePago(item)}
                    disabled={isLocked}
                    className={`text-xs px-2 py-1 rounded-lg ${
                      item.pago
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {item.pago ? 'Pago' : 'Pendente'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}