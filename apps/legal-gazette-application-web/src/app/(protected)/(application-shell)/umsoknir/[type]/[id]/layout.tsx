'use client'

import { Box } from '@dmr.is/ui/components/island-is'

import * as styles from './form.css'

export default function ApplicationShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Box className={styles.shellContent}>{children}</Box>
}
