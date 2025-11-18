'use client'

import { HeaderNoAuth } from '@dmr.is/ui/components/Header/HeaderNoAuth'

import '../../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderNoAuth />
      {children}
    </>
  )
}
