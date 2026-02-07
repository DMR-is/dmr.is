'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { BulletList } from '@dmr.is/ui/components/island-is/BulletList'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  ALLOWED_FORM_TYPES,
  FormTypes,
  PageRoutes,
} from '../../../../../lib/constants'

export default function ApplicationTypePage({
  params,
}: {
  params: { type: FormTypes }
}) {
  const title = ALLOWED_FORM_TYPES.includes(params.type)
    ? 'Auðkenni auglýsingar vantar í slóðina'
    : 'Auglýsingar tegund er ekki til.'

  return (
    <Box padding={[4, 5, 6]}>
      <Box padding={[1, 2, 3, 4]} background="white">
        <Stack space={[1, 2]}>
          <Text variant="h2">{title}</Text>
          <Stack space={1}>
            <Text variant="h4">
              Hægt er að sækja um eftirfarandi auglýsingar.
            </Text>
            <BulletList type="ul">
              <Bullet>Almenn auglýsing</Bullet>
              <Bullet>Dánarbú</Bullet>
              <Bullet>Þrotabú</Bullet>
            </BulletList>
          </Stack>
          <LinkV2 href={PageRoutes.APPLICATIONS}>
            <Button variant="text" size="small" icon="arrowForward">
              Opna auglýsingar
            </Button>
          </LinkV2>
        </Stack>
      </Box>
    </Box>
  )
}
