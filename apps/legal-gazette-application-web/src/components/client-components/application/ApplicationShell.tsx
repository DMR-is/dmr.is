'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { ApplicationFooter } from './footer/ApplicationFooter'
import * as styles from './application.css'

export const ApplicationShell = ({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar?: React.ReactNode
}) => {
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
        {sidebar && (
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <Box paddingY={[2, 4]}>{sidebar}</Box>
          </GridColumn>
        )}
      </GridRow>
    </GridContainer>
  )
}
