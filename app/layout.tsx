import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'

import './globals.css'

const notoSans = Noto_Sans_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans' 
})
const notoSerif = Noto_Serif_SC({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif' 
})

export const metadata: Metadata = {
  title: 'Avalon - 阿瓦隆游戏助手',
  description: '线下桌游阿瓦隆的游戏主持助手，自动管理角色分配、组队投票、任务执行和发言计时',
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
