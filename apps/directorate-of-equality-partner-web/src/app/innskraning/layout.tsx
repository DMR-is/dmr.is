import { HeaderNoAuth } from '@dmr.is/ui/components/Header/HeaderNoAuth'

import { layoutText } from '../../lib/text'

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderNoAuth variant="white" title={layoutText.headerTitle} />
      {children}
    </>
  )
}
