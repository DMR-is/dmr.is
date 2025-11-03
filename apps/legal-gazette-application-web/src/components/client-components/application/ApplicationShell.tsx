'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { ApplicationFooter } from './footer/ApplicationFooter'
import * as styles from './application.css'
import { ApplicationSidebar } from './ApplicationSidebar'

type Props = {
  children: React.ReactNode
}

export const ApplicationShell = ({ children }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '9/12']}>
          <Box
            className={styles.applicationShellStyles}
            paddingTop={[7, 9]}
            paddingBottom={[4, 6]}
            paddingX={[9, 12]}
            background="white"
          >
            {children}
          </Box>
          <ApplicationFooter />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '3/12']}>
          <ApplicationSidebar />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
