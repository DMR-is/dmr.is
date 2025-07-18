'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './application-shell.css'

export default function ApplicationShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box background="purple100" paddingY={6} className={styles.shellWrapper}>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12']}>
            <Box padding={4} background="white">
              {children}
            </Box>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <Box paddingY={4}>
              <Text variant="h4">Texti hér</Text>
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
