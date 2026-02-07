import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { SearchIssuesPage } from '../../../components/client-components/search-issues-page/SearchIssuesPage'

export default function Page() {
  return (
    <>
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '7/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Text variant="h2" as="h1" marginBottom={2}>
              Útgefin tölublöð
            </Text>
            <Text variant="intro">
              Hér er hægt að finna nýjustu tölublöð Lögbirtingablaðsins á PDF
              sniði.
            </Text>
          </GridColumn>
        </GridRow>
      </GridContainer>
      <Box background="blue100" marginTop={6} paddingY={4}>
        <GridContainer>
          <Box marginBottom={4}></Box>
          <SearchIssuesPage />
        </GridContainer>
      </Box>
    </>
  )
}
