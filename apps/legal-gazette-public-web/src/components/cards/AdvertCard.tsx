import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import {
  Box,
  Button,
  Inline,
  LinkV2,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'

type Props = {
  advert: AdvertDto
}

export const AdvertCard = ({ advert }: Props) => {
  return (
    <Box padding={3} background="white" borderRadius="large" border="standard">
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow">
            {advert.owner}
          </Text>
          <Text color="purple400" variant="eyebrow">
            Útgáfudagur:{' '}
            {format(
              new Date(advert.publishedAt ?? advert.scheduledAt),
              'dd. MMMM yyyy',
              {
                locale: is,
              },
            )}
          </Text>
        </Inline>
        <Stack space={0}>
          <Text variant="h3">{advert.publicationNumber}</Text>
          <Text variant="default">{advert.title}</Text>
        </Stack>
        <Inline justifyContent="spaceBetween">
          <Tag outlined variant="blue">
            {advert.category.title}
          </Tag>
          <LinkV2 href={`${PageRoutes.AUGLYSING.replace('[id]', advert.id)}`}>
            <Button size="small" iconType="outline" icon="open" variant="text">
              Skoða nánar
            </Button>
          </LinkV2>
        </Inline>
      </Stack>
    </Box>
  )
}
