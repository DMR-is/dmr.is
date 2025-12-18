import { Header } from '@dmr.is/ui/components/Header/Header'

export default async function ProtectedLayout({
  children,
  view,
}: {
  children: React.ReactNode
  view: React.ReactNode
}) {
  return (
    <>
      <Header variant="white" />
      {view}
      {children}
    </>
  )
}
