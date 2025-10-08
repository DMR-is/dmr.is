import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { AdvertFormAccordion } from '../accordion/AdvertFormAccordion'

export const AdvertForm = () => {
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
        <AdvertFormAccordion />
      </Stack>
    </GridContainer>
  )
}
