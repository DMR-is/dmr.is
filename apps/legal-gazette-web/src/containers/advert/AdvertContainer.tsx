import { ErrorBoundary } from 'react-error-boundary'

import { HydrateClient } from '@dmr.is/trpc/client/server'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'
type AdvertContainerProps = {
  advertId: string
}

export function AdvertContainer({ advertId }: AdvertContainerProps) {
  return (
    <HydrateClient>
      <Box paddingY={[4, 5, 6]} background="purple100">
        <GridContainer className="print-hidden">
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <AdvertFormContainer advertId={advertId} />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
              <ErrorBoundary
                fallback={<div>Villa kom upp við að hlaða hliðarstiku</div>}
              >
                <AdvertSidebarContainer advertId={advertId} />
              </ErrorBoundary>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </HydrateClient>
  )
}
