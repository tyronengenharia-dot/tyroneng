import { PropostaTabs } from '@/components/propostas/PropostaTabs'

export default function PropostasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-zinc-100 tracking-tight">
            Propostas
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie e acompanhe suas propostas comerciais.
          </p>
        </div>

        {/* Linkable tab bar */}
        <PropostaTabs />

        {children}
      </div>
    </div>
  )
}
