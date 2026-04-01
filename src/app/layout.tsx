import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tyron Engenharia',
  description: 'ERP de engenharia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex">
            <Sidebar />

            <Toaster richColors position="top-right" />

            <main className="flex-1 min-h-screen p-6 bg-[#0a0a0a]">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}