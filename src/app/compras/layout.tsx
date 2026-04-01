import { ComprasTabs } from '@/components/compras/ComprasTabs'

export default function ComprasLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      <ComprasTabs />

      {children}
    </div>
  )
}