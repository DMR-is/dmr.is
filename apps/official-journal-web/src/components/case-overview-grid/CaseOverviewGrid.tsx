import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../section/Section'

type Props = {
  children: React.ReactNode
}

export const CaseOverviewGrid = ({ children }: Props) => {
  return (
    <Section paddingTop="off">
      <GridContainer>
        <GridRow rowGap={['p2', 3]}>
          <GridColumn
            paddingTop={2}
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            {children}
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
