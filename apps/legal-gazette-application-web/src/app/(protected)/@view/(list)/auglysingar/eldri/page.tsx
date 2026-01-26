import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { OldAdvertsListContainer } from '../../../../../../containers/AdvertsListContainer'

export default function MyOldAdvertsPage() {
  return (
    <Box background={'blue100'} paddingTop={[3, 5]} paddingBottom={[6, 8]}>
      <Stack space={2}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
              <Inline space={2} alignY="bottom" justifyContent={'spaceBetween'}>
                <Text variant="h3">Eldri auglýsingar</Text>
                <LinkV2 href="/auglysingar">
                  <Button size="small" variant="utility" colorScheme="white">
                    Mínar auglýsingar
                  </Button>
                </LinkV2>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
        <OldAdvertsListContainer />
      </Stack>
    </Box>
  )
}
