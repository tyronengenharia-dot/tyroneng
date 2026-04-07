import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Toaster } from 'sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex">
        <Sidebar />
        <Toaster richColors position="top-right" />
        <main className="flex-1 min-h-screen p-6 bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
