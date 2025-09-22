import { Box } from '@dmr.is/ui/components/island-is'

import * as styles from './application-shell.css'

export default function ApplicationShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box background="purple100" paddingY={6} className={styles.shellWrapper}>
      {children}
    </Box>
  )
}
