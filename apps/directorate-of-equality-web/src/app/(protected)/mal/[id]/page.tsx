import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'

import { ReportContainer } from '../../../../containers/report/ReportContainer'

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <GridContainer>
      <h1>Mál {id}</h1>
      <ReportContainer id={id} />
    </GridContainer>
  )
}
