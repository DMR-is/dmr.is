'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import * as styles from './Form.css'

type AdvertSidebarProps = {
  children?: React.ReactNode
}

export const AdvertSidebar = ({ children }: AdvertSidebarProps) => {
  return (
    <Box className={styles.advertSideBarStyle}>
      <Stack space={2}>{children}</Stack>
    </Box>
  )
}
