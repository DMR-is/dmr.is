'use client'

import {
  Box,
  Bullet,
  BulletList,
  Button,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import {
  ALLOWED_FORM_TYPES,
  FormTypes,
  PageRoutes,
} from '../../../../lib/constants'

export default function ApplicationTypePage({
  params,
}: {
  params: { type: FormTypes }
}) {
  const title = ALLOWED_FORM_TYPES.includes(params.type)
    ? 'Auðkenni umsóknar vantar í slóðina'
    : 'Umsóknar tegund er ekki til.'

  return (
    <Box padding={[4, 5, 6]}>
      <Box padding={[1, 2, 3, 4]} background="white">
        <Stack space={[1, 2]}>
          <Text variant="h2">{title}</Text>
          <Stack space={1}>
            <Text variant="h4">Hægt er að sækja um eftirfarandi umsóknir.</Text>
            <BulletList type="ul">
              <Bullet>Almenna umsókn</Bullet>
              <Bullet>Innköllun dánarbús</Bullet>
              <Bullet>Innköllun þrotabús</Bullet>
            </BulletList>
          </Stack>
          <LinkV2 href={PageRoutes.APPLICATIONS}>
            <Button variant="text" size="small" icon="arrowForward">
              Opna umsóknir
            </Button>
          </LinkV2>
        </Stack>
      </Box>
    </Box>
  )
}
