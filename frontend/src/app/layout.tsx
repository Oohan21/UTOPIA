import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/common/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/common/QueryProvider'
import { ComparisonProvider } from '@/lib/providers/ComparisonProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UTOPIA - Ethiopian Real Estate Platform',
  description: 'Find, list, and value properties in Ethiopia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ComparisonProvider>
              {children}
              <Toaster position="top-right" />
            </ComparisonProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}