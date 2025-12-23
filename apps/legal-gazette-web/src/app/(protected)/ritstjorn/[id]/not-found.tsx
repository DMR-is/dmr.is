'use client'

import { Box, Button, Text } from '@dmr.is/ui/components/island-is'

import { LinkV2 } from '@island.is/island-ui/core'

import { Route } from '../../../../lib/constants'

export default function NotFound() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="full"
      background="white"
      padding={6}
    >
      <Box>
        <Text variant="h2" marginBottom={2}>
          Auglýsing fannst ekki
        </Text>
        <Text marginBottom={4}>
          Við fundum ekki auglýsinguna sem var beðið um. Hún gæti hafa verið
          fjarlægð eða átt sér aldrei stað.
        </Text>
        <LinkV2 href={Route.RITSTJORN}>
          <Button
            size="small"
            preTextIcon="arrowBack"
            preTextIconType="outline"
            variant="primary"
          >
            Til baka
          </Button>
        </LinkV2>
      </Box>
    </Box>
  )
}
