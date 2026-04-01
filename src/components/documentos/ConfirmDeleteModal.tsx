'use client'

export function ConfirmDeleteModal({ title, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4">

        <h2 className="text-lg font-semibold text-red-400">
          Excluir Categoria
        </h2>

        <p className="text-sm opacity-70">
          Tem certeza que deseja excluir <b>{title}</b>?
        </p>

        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 rounded"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>

        </div>

      </div>

    </div>
  )
}