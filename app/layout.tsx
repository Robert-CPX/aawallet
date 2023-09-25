import { Navbar, Footer, Provider } from '@/components'
import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AAWallet',
  description: 'A implementation of abstraction account wallet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <div className='flex flex-col min-h-screen'>
            <Navbar />
            {children}
            <Footer />
          </div>
        </Provider>
      </body>
    </html>
  )
}
