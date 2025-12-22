'use client'

import {
  Box,
  Bullet,
  BulletList,
  Button,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

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
