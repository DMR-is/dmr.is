import { Box, Inline, Stack, Text } from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
import { formatDate } from '../../lib/utils'

type Props = {
  advert: AdvertDto
}

export const AdvertDisplay = ({ advert }: Props) => {
  return (
    <Box border="standard" borderRadius="large" padding={4}>
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text>{`${advert.publicationNumber}${advert.version}`}</Text>
          {advert.publishedAt && (
            <Text fontWeight="light">{`Útgefið ${formatDate(advert.publishedAt)}`}</Text>
          )}
        </Inline>
        <Text variant="h4">{advert.title}</Text>
        <Box dangerouslySetInnerHTML={{ __html: advert.html }} />
      </Stack>
    </Box>
  )
}
