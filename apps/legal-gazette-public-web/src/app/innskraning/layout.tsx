'use client'

import { HeaderNoAuth } from '@dmr.is/ui/components/HeaderNoAuth/HeaderNoAuth'

import '../../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="is">
      <body>
        <HeaderNoAuth />
        {children}
      </body>
    </html>
  )
}
