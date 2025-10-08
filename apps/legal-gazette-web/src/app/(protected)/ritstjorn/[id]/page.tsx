import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { AdvertContainer } from '../../../../containers/advert/AdvertContainer'
import { getTrpcServer } from '../../../../lib/trpc/server/server'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const { trpc } = await getTrpcServer()

  const advert = await trpc.advertApi.getAdvert({ id: params.id })
  void trpc.baseEntity.getAllEntities()

  return (
    <Box padding={6} background="purple100">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            <AdvertContainer advert={advert} />
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            {/* <AdvertSidebar /> */}
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
