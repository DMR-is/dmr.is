import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { ArrowLink } from '@dmr.is/ui/components/island-is/ArrowLink'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { PublishedPublicationDto } from '../../../gen/fetch'

type Props = {
  publication: PublishedPublicationDto
}

export const PublicationCard = ({ publication }: Props) => {
  return (
    <Box padding={3} background="white" borderRadius="large" border="standard">
      <Stack space={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text variant="h4" as="span">
            {publication.title}
          </Text>

          <Box style={{ flexShrink: 0 }}>
            <Inline space={1} alignY="top" justifyContent="flexEnd">
              <Icon
                icon="time"
                size="small"
                type="outline"
                title="Útgáfudagur"
              />
              <Text variant="small" title="Útgáfudagur">
                {format(new Date(publication.publishedAt), 'dd. MMMM yyyy', {
                  locale: is,
                })}
              </Text>
            </Inline>
          </Box>
        </div>
        <Stack space={2}>
          <Inline space={1} alignY="center">
            <Text variant="small" as="span" title="Útgáfunúmer">
              {publication.publicationNumber}
            </Text>
            <Text variant="small" as="span" title="Birting">
              {publication.version}
            </Text>
          </Inline>
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
              href={`/auglysingar/${publication.publicationNumber}/${publication.version}`}
            >
              Skoða
            </ArrowLink>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  )
}
