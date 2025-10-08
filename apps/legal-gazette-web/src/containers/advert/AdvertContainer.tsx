import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto } from '../../gen/fetch'
import { AdvertFormContainer } from './AdvertFormContainer'
import { AdvertSidebarContainer } from './AdvertSidebarContainer'

type Props = {
  advert: AdvertDetailedDto
}

export async function AdvertContainer({ advert }: Props) {
  return (
    <Box paddingY={[4, 5, 6]} background="purple100">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            <AdvertFormContainer advert={advert} />
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <AdvertSidebarContainer />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
