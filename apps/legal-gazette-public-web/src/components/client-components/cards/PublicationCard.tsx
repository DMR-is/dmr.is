import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import {
  ArrowLink,
  Box,
  Inline,
  Stack,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublishedPublicationDto } from '../../../gen/fetch'

type Props = {
  publication: PublishedPublicationDto
}

export const PublicationCard = ({ publication }: Props) => {
  return (
    <Box padding={3} background="white" borderRadius="large" border="standard">
      <Stack space={0}>
        <Inline
          justifyContent="spaceBetween"
          alignY="center"
          flexWrap="nowrap"
          space={2}
        >
          {/* <Text color="purple400" variant="eyebrow">
            {publication.createdBy}
          </Text> */}
          <Text variant="h4">{publication.title}</Text>
          <Text variant="small" title="Útgáfudagur">
            {format(new Date(publication.publishedAt), 'dd. MMMM yyyy', {
              locale: is,
            })}
          </Text>
        </Inline>
        <Stack space={2}>
          <Text variant="small" title="Útgáfunúmer">
            {publication.publicationNumber}
          </Text>
          <Inline justifyContent="spaceBetween" alignY={'bottom'}>
            <Inline space={1} alignY="center">
              <Tag
                href={`/auglysingar?categoryId=${publication.category.id}`}
                variant="blue"
              >
                {publication.category.title}
              </Tag>
              <Tag
                href={`/auglysingar?typeId=${publication.type.id}`}
                variant="blueberry"
              >
                {publication.type.title}
              </Tag>
            </Inline>
            <ArrowLink
              href={`/auglysingar/${publication.advertId}/${publication.version}`}
            >
              Sjá nánar
            </ArrowLink>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  )
}
