import { supabase } from '@/lib/supabaseClient'

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function FolhaTable({
  data,
  onUpdate,
  onOpenAdjust,
}: {
  data: any[]
  onUpdate: () => void
  onOpenAdjust: (item: any) => void
}) {
  async function togglePago(item: any) {
    await supabase
      .from('folha_mensal')
      .update({ pago: !item.pago })
      .eq('id', item.id)
    onUpdate()
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.07]">
            <th className="px-5 py-3.5 text-left text-xs text-white/40 uppercase tracking-wider font-medium">
              Funcionário
            </th>
            <th className="px-5 py-3.5 text-right text-xs text-white/40 uppercase tracking-wider font-medium">
              Base
            </th>
            <th className="px-5 py-3.5 text-right text-xs text-white/40 uppercase tracking-wider font-medium">
              Extras
            </th>
            <th className="px-5 py-3.5 text-center text-xs text-white/40 uppercase tracking-wider font-medium">
              Ajustes
            </th>
            <th className="px-5 py-3.5 text-right text-xs text-white/40 uppercase tracking-wider font-medium">
              Total
            </th>
            <th className="px-5 py-3.5 text-center text-xs text-white/40 uppercase tracking-wider font-medium">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/[0.05]">
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
                className={`transition-colors ${
                  isLocked ? 'opacity-40' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* NOME */}
                <td className="px-5 py-4 text-white font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60 shrink-0">
                      {item.funcionarios?.nome?.charAt(0).toUpperCase()}
                    </div>
                    {item.funcionarios?.nome}
                  </div>
                </td>

                {/* BASE */}
                <td className="px-5 py-4 text-right text-white/80 tabular-nums">
                  {fmtCurrency(item.salario_base)}
                </td>

                {/* EXTRAS */}
                <td className="px-5 py-4 text-right text-amber-400 tabular-nums">
                  {fmtCurrency(item.extras)}
                </td>

                {/* AJUSTES */}
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {(adicional > 0 || desconto > 0) && (
                      <span className="text-xs tabular-nums space-x-1">
                        {adicional > 0 && (
                          <span className="text-emerald-400">+{fmtCurrency(adicional)}</span>
                        )}
                        {desconto > 0 && (
                          <span className="text-red-400">−{fmtCurrency(desconto)}</span>
                        )}
                      </span>
                    )}
                    <button
                      onClick={() => onOpenAdjust(item)}
                      disabled={isLocked}
                      className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-30"
                    >
                      Ajustar
                    </button>
                  </div>
                </td>

                {/* TOTAL */}
                <td className="px-5 py-4 text-right font-semibold tabular-nums text-white">
                  {fmtCurrency(total)}
                </td>

                {/* STATUS */}
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => togglePago(item)}
                    disabled={isLocked}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-30 ${
                      item.pago
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {item.pago ? '✓ Pago' : 'Pendente'}
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