import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { OldAdvertsListContainer } from '../../../../../../containers/AdvertsListContainer'

export default function MyOldAdvertsPage() {
  return (
    <Stack space={[2, 3]}>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <LinkV2 href="/auglysingar">
              <Button
                preTextIcon="arrowBack"
                preTextIconType="outline"
                size="small"
                variant="text"
              >
                Til baka í mínar auglýsingar
              </Button>
            </LinkV2>
          </GridColumn>
        </GridRow>
      </GridContainer>
      <OldAdvertsListContainer />
    </Stack>
  )
}
