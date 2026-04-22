import { getServerSession } from 'next-auth'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { ApplicationContainer } from '../../components/front-page/ApplicationContainer'
import { HeroContainer } from '../../components/front-page/HeroContainer'
import { SectionContainer } from '../../components/front-page/SectionContainer'
import { authOptions } from '../../lib/auth/authOptions'

export default async function IndexPage() {
  const session = await getServerSession(authOptions)

  return (
    <Box marginTop={[2, 4]}>
      <HeroContainer userName={session?.user?.name} />
      <SectionContainer />
      <ApplicationContainer />
    </Box>
  )
}
