import { Footer } from '@dmr.is/ui/components/Footer/Footer'

export default function UmsoknirLadningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer type="inner" />
    </>
  )
}
