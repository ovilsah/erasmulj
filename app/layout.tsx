import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'Erasmus+ Dashboard',
  description: 'Dashboard interactiu per visualitzar les dades dels estudiants Erasmus',
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
