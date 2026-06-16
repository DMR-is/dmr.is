import { Suspense } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { CompanyDetailContainer } from '../../../../containers/company/CompanyDetailContainer'

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Box
      background="purple100"
      style={{ minHeight: '100dvh' }}
      paddingY={[1, 1, 1, 4]}
      paddingX={[2, 2, 2, 6]}
    >
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Suspense fallback={<SkeletonLoader repeat={4} height={40} space={2} />}>
              <CompanyDetailContainer id={id} />
            </Suspense>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
