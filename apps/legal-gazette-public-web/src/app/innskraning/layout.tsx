'use client'

import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderLogin />
      {children}
    </>
  )
}
