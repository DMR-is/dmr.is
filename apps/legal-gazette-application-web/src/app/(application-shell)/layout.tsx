'use client'

import { usePathname } from 'next/navigation'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { FormTypes } from '../../lib/constants'
import * as styles from './application-shell.css'

export default function ApplicationShellLayout({
  children,
  footer,
}: {
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const pathname = usePathname()

  const formToUse = pathname.includes(FormTypes.BANKRUPTCY)
  return (
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
              {children}
            </Box>
            {footer}
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <Box paddingY={[2, 4]}>
              <Text variant="h4">Texti hér</Text>
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
