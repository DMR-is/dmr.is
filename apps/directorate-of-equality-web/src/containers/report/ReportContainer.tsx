import { ErrorBoundary } from 'react-error-boundary'

import { HydrateClient } from '@dmr.is/trpc/client/server'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { ReportFormContainer } from './ReportFormContainer'
import { ReportSidebarContainer } from './ReportSidebarContainer'

type ReportContainerProps = {
  id: string
}

export function ReportContainer({ id }: ReportContainerProps) {
  return (
    <HydrateClient>
      <Box paddingY={[4, 5, 6]} background="purple100">
        <GridContainer className="print-hidden">
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <ReportFormContainer id={id} />
              <ErrorBoundary
                fallback={<div>Villa kom upp við að hlaða skýrslu</div>}
              ></ErrorBoundary>
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
              <ReportSidebarContainer id={id} />
              <ErrorBoundary
                fallback={<div>Villa kom upp við að hlaða hliðarstiku</div>}
              ></ErrorBoundary>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </HydrateClient>
  )
}
