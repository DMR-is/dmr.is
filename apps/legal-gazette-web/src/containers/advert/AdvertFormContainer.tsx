'use client'

import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertBaseFields } from '../../components/client-components/accordion/accordion-items/AdvertBaseFields'
import { AdvertReadonlyFields } from '../../components/client-components/accordion/accordion-items/AdvertReadonlyFields'
import { ContentFields } from '../../components/client-components/accordion/accordion-items/ContentFields'
import { PublicationsFields } from '../../components/client-components/accordion/accordion-items/PublicationsFields'
import { SignatureFields } from '../../components/client-components/accordion/accordion-items/SignatureFields'
import { AdvertFormAccordion } from '../../components/client-components/accordion/AdvertFormAccordion'
import { AdvertDetailedDto } from '../../gen/fetch'
import { trpc } from '../../lib/trpc/client'

type AdvertContainerProps = {
  advert: AdvertDetailedDto
}

export function AdvertFormContainer({ advert }: AdvertContainerProps) {
  const [{ types }] = trpc.baseEntity.getAllEntities.useSuspenseQuery()
  const { data: categoriesForTypes } = trpc.baseEntity.getCategories.useQuery({
    type: advert.type.id,
  })
  // const [{ publications }] =
  //   trpc.publications.

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
      title: 'Almennar upplýsingar',
      children: (
        <AdvertBaseFields
          id={advert.id}
          types={types}
          categories={categoriesForTypes?.categories ?? []}
          typeId={advert.type.id}
          categoryId={advert.category.id}
          title={advert.title ?? ''}
          additionalText={advert.additionalText ?? ''}
        />
      ),
      hidden: false,
    },
    {
      title: 'Efni auglýsingar',
      children: (
        <ContentFields
          id={advert.id}
          caption={advert.caption ?? ''}
          content={advert.content ?? ''}
        />
      ),
      // hidden: !!advert.caption && !!advert.content,
      hidden: false,
    },
    {
      title: 'Undirritun',
      children: (
        <SignatureFields
          id={advert.id}
          signatureName={advert.signatureName ?? ''}
          signatureOnBehalfOf={advert.signatureOnBehalfOf ?? ''}
          signatureLocation={advert.signatureLocation ?? ''}
          signatureDate={advert.signatureDate ?? new Date().toISOString()}
        />
      ),
    },
    {
      title: 'Birtingar',
      children: (
        <PublicationsFields
          id={advert.id}
          publications={advert.publications ?? []}
          advertStatus={advert.status}
        />
      ),
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
