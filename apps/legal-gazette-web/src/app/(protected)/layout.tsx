import { Header } from '@dmr.is/ui/components/Header/Header'
import { Box } from '@dmr.is/ui/components/island-is'

import { MenuButton } from '../../components/buttons/MenuButton'
import { Providers } from '../../components/providers/Providers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <Header
        variant="blue"
        settings={
          <Box marginRight={2}>
            <MenuButton />
          </Box>
        }
      />
      {children}
    </Providers>
  )
}
