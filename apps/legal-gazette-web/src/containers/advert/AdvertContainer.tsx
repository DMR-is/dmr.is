'use client'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { trpc } from '../../lib/trpc/client'
import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'

type AdvertContainerProps = {
  id: string
}

export function AdvertContainer({ id }: AdvertContainerProps) {
  const [advert] = trpc.adverts.getAdvert.useSuspenseQuery({
    id: id,
  })

  if (!advert) {
    return <div>Advert not found</div>
  }

  return (
    <Box paddingY={[4, 5, 6]} background="purple100">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            <AdvertFormContainer advert={advert} />
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <AdvertSidebarContainer advert={advert} />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
