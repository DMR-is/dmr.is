'use client'

import { Box} from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Route } from '../../../../lib/constants'

export default function Error({ error }: { error: Error }) {
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
        <Text variant="h2" marginBottom={2} color="red600">
          Villa kom upp
        </Text>
        <Text marginBottom={4}>
          Því miður fór eitthvað úrskeiðis við vinnslusíðu auglýsingar.
        </Text>
        {error?.message && (
          <Box
            background="blue100"
            borderRadius="large"
            padding={2}
            marginBottom={4}
          >
            <Text fontWeight="medium" color="blue600" marginBottom={1} as="div">
              Villuboð:
            </Text>
            <Text color="blue600">{error.message}</Text>
          </Box>
        )}
        <LinkV2 href={Route.RITSTJORN}>
          <Button
            size="small"
            preTextIcon="arrowBack"
            preTextIconType="outline"
            variant="primary"
          >
            Til baka í auglýsingar
          </Button>
        </LinkV2>
      </Box>
    </Box>
  )
}
