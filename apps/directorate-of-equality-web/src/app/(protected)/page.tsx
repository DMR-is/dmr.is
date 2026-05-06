import { getServerSession } from 'next-auth'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { HeroContainer } from '../../containers/front-page/HeroContainer'
import { PanelsContainer } from '../../containers/front-page/PanelsContainer'
import { SectionContainer } from '../../containers/front-page/SectionContainer'
import { authOptions } from '../../lib/auth/authOptions'

export default async function IndexPage() {
  const session = await getServerSession(authOptions)

  return (
    <Box marginTop={[2, 4]}>
      <HeroContainer userName={session?.user?.name} />
      <SectionContainer />
      <PanelsContainer />
    </Box>
  )
}
