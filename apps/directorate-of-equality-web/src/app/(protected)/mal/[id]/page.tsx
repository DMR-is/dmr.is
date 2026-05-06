import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { trpc } from '../../../../lib/trpc/client/server'
export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const report = await fetchQueryWithHandler(
    trpc.reports.getById.queryOptions({ id: id }),
  )

  return (
    <HydrateClient>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Text variant='h4' fontWeight='medium' >
              {JSON.stringify(report)}
            </Text>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </HydrateClient>
  )
}
