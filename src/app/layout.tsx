import './globals.css'
import type { Metadata } from 'next'
import { ImageProvider } from '../lib/image-context'

export const metadata: Metadata = {
  title: 'リフォトル - リフォームシミュレーション',
  description: '想像を、見えるカタチに。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <ImageProvider>
          {children}
        </ImageProvider>
      </body>
    </html>
  )
}