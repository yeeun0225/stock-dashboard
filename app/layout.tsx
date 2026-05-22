import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '모닝 대시보드',
  description: '매일 아침 주식 지표를 한눈에',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#030712',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={geist.className}>
      <body className="min-h-screen flex flex-col bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
