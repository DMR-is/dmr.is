'use client'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

export const ApplicationList = () => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <ul>
            <li>Mín umsókn</li>
          </ul>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
