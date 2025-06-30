import { Header } from '../components/client-components/header/Header'

import '../styles/global.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="is">
      <body>
        <Header variant="white" />
        {children}
      </body>
    </html>
  )
}
