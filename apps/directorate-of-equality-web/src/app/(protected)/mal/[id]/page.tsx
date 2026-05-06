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
    <Box background='purple100' style={{ minHeight: '100dvh' }} paddingY={4} paddingX={6}>

    <GridContainer>
      <ReportContainer id={id} />
    </GridContainer>
    </Box>
  )
}
