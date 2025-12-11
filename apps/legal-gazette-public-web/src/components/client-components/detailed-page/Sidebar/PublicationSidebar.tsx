'use client'

import Link from 'next/link'

import { Box, Button, Stack, Text } from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertPublicationDetailedDto } from '../../../../gen/fetch'

type Props = {
  publication: AdvertPublicationDetailedDto
}

export const PublicationSidebar = ({ publication }: Props) => {
  // const trpc = useTRPC()
  // const { mutate, isPending } = useMutation(
  //   trpc.getPublicationPdf.mutationOptions({
  //     onSuccess: (data) => {
  //       console.log(data)
  //       console.log('data.size', data.size)
  //       console.log('data.type', data.type)
  //     },
  //     onError: () => {
  //       toast.error('Ekki tókst að sækja PDF skjal')
  //     },
  //   }),
  // )

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
        </Stack>
      </Box>
      <Box background="dark100" padding={3} borderRadius="large">
        <Link
          href={`/api/adverts/${publication.advert.id}/pdf?version=${publication.publication.version}`}
          target="_blank"
          rel="noreferrer"
        >
          <Button
            variant="text"
            icon="download"
            iconType="outline"
            size="small"
          >
            Prenta auglýsingu
          </Button>
        </Link>
      </Box>
    </Stack>
  )
}
