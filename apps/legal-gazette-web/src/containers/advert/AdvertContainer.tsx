import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { HydrateClient } from '../../lib/nTrpc/client/server'
import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'
type AdvertContainerProps = {
  id: string
}

export function AdvertContainer({ id }: AdvertContainerProps) {
  return (
    <HydrateClient>
      <Box paddingY={[4, 5, 6]} background="purple100">
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <AdvertFormContainer id={id} />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
              <AdvertSidebarContainer id={id} />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </HydrateClient>
  )
}
