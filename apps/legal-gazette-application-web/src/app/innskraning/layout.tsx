import { HeaderNoAuth } from '@dmr.is/ui/components/HeaderNoAuth/HeaderNoAuth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderNoAuth variant="white" />
      {children}
    </>
  )
}
