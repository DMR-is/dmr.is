import { Footer } from '../../../components/footer/Footer'

export default function UmsoknirLadningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
