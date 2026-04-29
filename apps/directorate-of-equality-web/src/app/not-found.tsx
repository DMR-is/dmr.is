import { getServerSession } from 'next-auth'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { Header } from '../components/header/Header'
import { authOptions } from '../lib/auth/authOptions'

export default async function NotFound() {
  const session = await getServerSession(authOptions)

  return (
    <>
      {session && <Header />}
      <GridContainer>
        <Box marginTop={10}>
          <ProblemTemplate
            title="Síða fannst ekki"
            message="Ekkert fannst á þessari slóð. Mögulega hefur síðan verið fjarlægð eða færð til."
            variant="info"
            noBorder={false}
            imgSrc="./assets/tolfraedi-image.svg"
          />
        </Box>
      </GridContainer>
    </>
  )
}
