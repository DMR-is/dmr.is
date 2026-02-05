import { ErrorBoundary } from 'react-error-boundary'

import { HydrateClient } from '@dmr.is/trpc/client/server'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'
type AdvertContainerProps = {
  advertId: string
}

export function AdvertContainer({ advertId }: AdvertContainerProps) {
  return (
    <HydrateClient>
      <Box paddingY={[4, 5, 6]} background="purple100">
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <AdvertFormContainer advertId={advertId} />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <ErrorBoundary fallback={<div>Villa kom upp við að hlaða hliðarstiku</div>}>
              <AdvertSidebarContainer advertId={advertId} />
              </ErrorBoundary>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </HydrateClient>
  )
}
