import { Header } from '@dmr.is/ui/components/client-components/Header/Header'

export default async function RootLayout({
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
