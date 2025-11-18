import { HeaderNoAuth } from '@dmr.is/ui/components/Header/HeaderNoAuth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderNoAuth variant="blue" />
      {children}
    </>
  )
}
