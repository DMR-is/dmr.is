import { getServerSession } from 'next-auth'

import { Suspense } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { HeroContainer } from '../../components/front-page/HeroContainer'
import { PanelsContainer } from '../../components/front-page/PanelsContainer'
import { SectionContainer } from '../../components/front-page/SectionContainer'
import { authOptions } from '../../lib/auth/authOptions'

export default async function IndexPage() {
  const session = await getServerSession(authOptions)

  return (
    <Box marginTop={[2, 4]}>
      <HeroContainer userName={session?.user?.name} />
      <Suspense fallback={null}>
        <SectionContainer />
      </Suspense>
      <PanelsContainer />
    </Box>
  )
}
