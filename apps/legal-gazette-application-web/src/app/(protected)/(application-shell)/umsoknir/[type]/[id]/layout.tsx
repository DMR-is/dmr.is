'use client'

import { Box } from '@island.is/island-ui/core'

import * as styles from './form.css'

export default function ApplicationShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Box className={styles.shellContent}>{children}</Box>
}
