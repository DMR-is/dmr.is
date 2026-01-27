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
            <GridColumn
              span={['12/12', '12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '0', '1/12']}
            >
              <Inline space={2} alignY="bottom" justifyContent={'spaceBetween'}>
                <Stack space={1}>
                  <Text variant="h3">Eldri auglýsingar</Text>
                  <Text>
                    Auglýsingar sem voru stofnaðar í eldri kerfum og birtar
                    fyrir 17. janúar 2026
                  </Text>
                </Stack>

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
