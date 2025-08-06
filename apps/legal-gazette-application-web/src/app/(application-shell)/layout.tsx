'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { ApplicationContextProvider } from '../../context/ApplicationContext'
import * as styles from './application-shell.css'

export default function ApplicationShellLayout(props: {
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <ApplicationContextProvider>
      <Box background="purple100" paddingY={6} className={styles.shellWrapper}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12']}>
              <Box
                className={styles.shellContent}
                paddingTop={[7, 9]}
                paddingBottom={[4, 6]}
                paddingX={[9, 12]}
                background="white"
              >
                {props.children}
              </Box>
              {props.footer}
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12']}>
              <Box paddingY={[2, 4]}>
                <Text variant="h4">Texti hér</Text>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </ApplicationContextProvider>
  )
}
