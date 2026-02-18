'use client'
import dynamic from 'next/dynamic'

import { Header } from '@dmr.is/ui/components/Header/Header'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { Providers } from '../../components/providers/Providers'

const DynamicMenuButton = dynamic(
  () => import('../../components/buttons/MenuButton'),
  {
    ssr: false,
  },
)

export default function RootLayout({
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
            <DynamicMenuButton />
          </Box>
        }
      />
      {children}
    </Providers>
  )
}
