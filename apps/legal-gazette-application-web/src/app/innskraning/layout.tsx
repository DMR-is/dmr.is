import { HeaderNoAuth } from '@dmr.is/ui/components/Header/HeaderNoAuth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="is">
      <body>
        <HeaderNoAuth variant="white" />
        {children}
      </body>
    </html>
  )
}
