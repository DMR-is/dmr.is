import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

/**
 * Route fallback for the awaited prefetches in `page.tsx`.
 *
 * The page blocks on those queries, so without this a client-side navigation
 * would sit on the previous page until the API answers. Nothing painted a
 * skeleton here before - the page rendered empty and filled in - so this is
 * also the first real loading state this route has had.
 */
export default function Loading() {
  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Box paddingBottom={2}>
            <SkeletonLoader height={64} borderRadius="large" />
          </Box>
          <SkeletonLoader
            repeat={5}
            height={44}
            space={1}
            borderRadius="large"
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
