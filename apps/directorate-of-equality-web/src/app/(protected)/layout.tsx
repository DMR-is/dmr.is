'use client'

import { Header } from '../../components/header/Header'

import '../../styles/global.css'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
