'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { formatDate } from '@dmr.is/utils-shared/format/date'

import { AdvertPublicationDetailedDto } from '../../../../gen/fetch'

type Props = {
  publication: AdvertPublicationDetailedDto
}

export const PublicationSidebar = ({ publication }: Props) => {

  const link = publication.publication.pdfUrl ?? `/api/adverts/${publication.advert.id}/pdf?version=${publication.publication.version}`

  return (
    <Stack space={[1, 2]}>
      <Box padding={3} background="blue100" borderRadius="large">
        <Stack space={[1, 2]}>
          <Stack space={0}>
            <Text variant="h4">Flokkur</Text>
            <Text variant="small">{publication.advert.category.title}</Text>
          </Stack>
          <Stack space={0}>
            <Text variant="h4">Tegund</Text>
            <Text variant="small">{publication.advert.type.title}</Text>
          </Stack>

          {publication.advert.publicationNumber && (
            <Stack space={0}>
              <Text variant="h4">Útgáfunúmer</Text>
              <Text variant="small">
                {publication.advert.publicationNumber}
              </Text>
            </Stack>
          )}

          {publication.publication.publishedAt && (
            <Stack space={0}>
              <Text variant="h4">Útgáfudagur</Text>
              <Text variant="small">
                {formatDate(new Date(publication.publication.publishedAt))}
              </Text>
            </Stack>
          )}

          {publication.publication.version && (
            <Stack space={0}>
              <Text variant="h4">Birting</Text>
              <Text variant="small">
                Birting {publication.publication.version}
              </Text>
            </Stack>
          )}
        </Stack>
      </Box>
      <Box background="dark100" padding={3} borderRadius="large">
        <LinkV2
          href={link}
          newTab
        >
          <Button
            variant="text"
            icon="document"
            iconType="outline"
            size="small"
          >
            Prenta auglýsingu
          </Button>
        </LinkV2>
      </Box>
    </Stack>
  )
}
