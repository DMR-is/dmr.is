// import { useUpdateAdvert } from 'apps/legal-gazette-web/src/hooks/useUpdateAdvert'

import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertReadonlyFields } from '../../components/client-components/accordion/accordion-items/AdvertReadonlyFields'
import { ContentFields } from '../../components/client-components/accordion/accordion-items/ContentFields'
import { AdvertFormAccordion } from '../../components/client-components/accordion/AdvertFormAccordion'
import { AdvertDetailedDto } from '../../gen/fetch'

type Props = {
  advert: AdvertDetailedDto
}

export async function AdvertFormContainer({ advert }: Props) {
  const items = [
    {
      title: 'Upplýsingar um auglýsingu',
      children: (
        <AdvertReadonlyFields
          id={advert.id}
          publicationNumber={advert.publicationNumber}
          createdAt={formatDate(advert.createdAt, 'dd. MMMM yyyy')}
          createdBy={advert.createdBy}
        />
      ),
    },
    {
      title: 'Efni auglýsingar',
      children: (
        <ContentFields
          id={advert.id}
          caption={advert.caption ?? 'Test'}
          content={advert.content ?? 'Test'}
        />
      ),
      // hidden: !!advert.caption && !!advert.content,
      hidden: false,
    },
  ].filter((item) => !item.hidden)

  return (
    <Box background="white" padding={[4, 6, 8]} borderRadius="large">
      <Stack space={[3, 4]}>
        <Stack space={[1, 2]}>
          <Text variant="h2">Vinnslusvæði Lögbirtingablaðsins</Text>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            at interdum risus. Orci varius natoque penatibus et magnis dis
            parturient montes, nascetur ridiculus mus. Phasellus finibus lacinia
            luctus. Donec in nisi et justo luctus egestas.
          </Text>
        </Stack>
        <AdvertFormAccordion items={items} />
      </Stack>
    </Box>
  )
}
