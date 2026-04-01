'use client'

export function DocumentPreview({ url, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">

      <div className="flex justify-between p-4">
        <button onClick={onClose}>Fechar</button>
        <a href={url} target="_blank">Abrir externo</a>
      </div>

      <iframe
        src={url}
        className="flex-1 w-full"
      />

    </div>
  )
}