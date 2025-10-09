import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'

export async function AdvertContainer() {
  return (
    <Box paddingY={[4, 5, 6]} background="purple100">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            <AdvertFormContainer />
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <AdvertSidebarContainer />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
