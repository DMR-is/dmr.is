'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import * as styles from './Report.css'

type ReportSidebarProps = {
  children?: React.ReactNode
}

export const ReportSidebar = ({ children }: ReportSidebarProps) => {
  return (
    <Box className={styles.reportSidebarStyle}>
      <Stack space={2}>{children}</Stack>
    </Box>
  )
}
