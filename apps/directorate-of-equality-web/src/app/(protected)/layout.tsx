'use client'

import { Header } from '@dmr.is/ui/components/Header/Header'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header info={{ title: 'Jafnréttisstofa' }} variant="blue" />
      {children}
    </>
  )
}
