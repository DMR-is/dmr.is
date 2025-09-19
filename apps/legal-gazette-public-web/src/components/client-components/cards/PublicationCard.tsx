import NextLink from 'next/link'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import {
  Box,
  Button,
  Inline,
  Stack,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublishedPublicationDto } from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'

type Props = {
  publication: PublishedPublicationDto
}

export const PublicationCard = ({ publication }: Props) => {
  return (
    <Box padding={3} background="white" borderRadius="large" border="standard">
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow">
            {publication.createdBy}
          </Text>
          <Text color="purple400" variant="eyebrow">
            Útgáfudagur:{' '}
            {format(new Date(publication.publishedAt), 'dd. MMMM yyyy', {
              locale: is,
            })}
          </Text>
        </Inline>
        <Stack space={0}>
          <Text variant="h3">{publication.publicationNumber}</Text>
          <Text variant="default">{publication.title}</Text>
        </Stack>
        <Inline justifyContent="spaceBetween">
          <Inline space={1} alignY="center">
            <Tag
              href={`/auglysingar?typeId=${publication.type.id}`}
              variant="blueberry"
            >
              {publication.type.title}
            </Tag>
            <Tag
              href={`/auglysingar?categoryId=${publication.category.id}`}
              variant="blue"
            >
              {publication.category.title}
            </Tag>
          </Inline>
          <NextLink
            href={`${PageRoutes.AUGLYSING.replace('[id]', publication.advertId)}/${publication.version}`}
          >
            <Button size="small" iconType="outline" icon="open" variant="text">
              Skoða nánar
            </Button>
          </NextLink>
        </Inline>
      </Stack>
    </Box>
  )
}
