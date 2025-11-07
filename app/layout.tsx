import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Facebook Auto Poster',
  description: 'Automatically post to Facebook daily',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
