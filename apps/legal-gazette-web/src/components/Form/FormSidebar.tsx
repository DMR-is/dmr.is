'use client'

import { Box, Stack } from '@dmr.is/ui/components/island-is'

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
