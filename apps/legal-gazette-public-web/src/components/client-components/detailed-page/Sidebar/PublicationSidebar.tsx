import { Box, Button, Stack, Text } from '@dmr.is/ui/components/island-is'

import { AdvertPublicationDetailedDto } from '../../../../gen/fetch'
import { formatDate } from '../../../../lib/utils'

type Props = {
  publication: AdvertPublicationDetailedDto
}

export const PublicationSidebar = ({ publication }: Props) => {
  return (
    <Stack space={[1, 2]}>
      <Box padding={3} background="blue100" borderRadius="large">
        <Stack space={[1, 2]}>
          <Stack space={0}>
            <Text variant="h4">Tegund</Text>
            <Text variant="small">{publication.advert.type.title}</Text>
          </Stack>
          <Stack space={0}>
            <Text variant="h4">Flokkur</Text>
            <Text variant="small">{publication.advert.category.title}</Text>
          </Stack>
          {publication.publication.publishedAt && (
            <Stack space={0}>
              <Text variant="h4">Útgáfudagur</Text>
              <Text variant="small">
                {formatDate(new Date(publication.publication.publishedAt))}
              </Text>
            </Stack>
          )}
          <Stack space={0}>
            <Text variant="h4">Innsent af</Text>
            <Text variant="small">{publication.advert.createdBy}</Text>
          </Stack>
        </Stack>
      </Box>
      <Box background="dark100" padding={3} borderRadius="large">
        <Button size="small" variant="text" icon="download" iconType="outline">
          Sækja PDF
        </Button>
      </Box>
    </Stack>
  )
}
