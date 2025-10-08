import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertReadonlyFields } from '../../components/client-components/accordion/accordion-items/ReadOnlyAccordionItem'
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
  ]

  return (
    <GridContainer>
      <Stack space={[3, 4]}>
        <GridRow>
          <GridColumn span="12/12">
            <Text marginBottom={[1, 2]} variant="h2">
              Vinnslusvæði Lögbirtingablaðsins
            </Text>
            <Text marginBottom={[1, 2]}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse at interdum risus. Orci varius natoque penatibus et
              magnis dis parturient montes, nascetur ridiculus mus. Phasellus
              finibus lacinia luctus. Donec in nisi et justo luctus egestas.
            </Text>
          </GridColumn>
        </GridRow>
        <AdvertFormAccordion items={items} />
      </Stack>
    </GridContainer>
  )
}
