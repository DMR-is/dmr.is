import { Header } from '@dmr.is/ui/components/Header/Header'

import { layoutText } from '../../lib/text'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header info={{ title: layoutText.headerTitle }} variant="white" />
      {children}
    </>
  )
}
