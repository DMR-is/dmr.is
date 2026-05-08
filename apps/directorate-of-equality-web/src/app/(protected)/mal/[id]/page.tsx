import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { ReportContainer } from '../../../../containers/report/ReportContainer'
import { trpc } from '../../../../lib/trpc/client/server'

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params


const report = await fetchQueryWithHandler(
  trpc.reports.getById.queryOptions({ id: id }),)

return (
  <HydrateClient>
      <Box background='purple100' style={{ minHeight: '100dvh' }} paddingY={4} paddingX={6}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
          <ReportContainer report={report} />
          </GridColumn>
        </GridRow>
      </GridContainer>
      </Box>
    </HydrateClient>
  )
}
