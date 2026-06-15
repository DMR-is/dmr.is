import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import * as styles from '../../report/Report.css'

type CompanySidebarProps = {
  children?: React.ReactNode
}

export const CompanySidebar = ({ children }: CompanySidebarProps) => {
  return (
    <Box className={styles.reportSidebarStyle}>
      <Stack space={2}>{children}</Stack>
    </Box>
  )
}
