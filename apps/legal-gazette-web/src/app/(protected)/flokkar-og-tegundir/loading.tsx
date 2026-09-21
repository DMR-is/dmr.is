import Hero from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

/**
 * Route fallback for the awaited overview prefetch in `page.tsx`.
 *
 * The page blocks on that query, so without this a client-side navigation would
 * sit on the previous page until the API answers. The container used to paint
 * its own skeleton off `isPending`; this restores the same instant feedback
 * from the route instead, mirroring the real layout closely enough that the
 * swap is not jarring.
 */
export default function CategoryTypeLoading() {
  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Flokkar og tegundir"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage
          />
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '3/12']}>
          <Box background="white" borderRadius="large" padding={2}>
            <SkeletonLoader
              repeat={4}
              height={40}
              space={2}
              borderRadius="large"
            />
          </Box>
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '9/12']}>
          <Box padding={2}>
            <SkeletonLoader
              repeat={8}
              height={40}
              space={1}
              borderRadius="large"
            />
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
