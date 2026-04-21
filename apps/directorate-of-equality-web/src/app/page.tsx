import { getServerSession } from 'next-auth'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { LogoutButton } from '../components/LogoutButton'
import { authOptions } from '../lib/auth/authOptions'

export default async function Index() {
  const session = await getServerSession(authOptions)

  return (
    <GridContainer>
      <Box paddingY={[3, 3, 5]}>
        <Stack space={3}>
          <Box
            display="flex"
            justifyContent="spaceBetween"
            alignItems="center"
          >
            <Text variant="h1">Jafnréttisstofa</Text>
            <LogoutButton />
          </Box>
          <Text variant="intro">
            Innskráð/ur sem {session?.user?.name ?? 'óþekktur notandi'}.
          </Text>
        </Stack>
      </Box>
    </GridContainer>
  )
}
