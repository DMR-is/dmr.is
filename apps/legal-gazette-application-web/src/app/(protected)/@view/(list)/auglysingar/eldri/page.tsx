import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

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
