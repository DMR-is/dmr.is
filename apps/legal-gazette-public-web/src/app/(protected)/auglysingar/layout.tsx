import { Box, GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { NavigateBack } from '../../../components/client-components/navigate-back/NavigateBack'
import * as styles from './grid-layout.css'

export default async function Layout({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <GridContainer>
      <Box paddingY={8} className={styles.gridLayout}>
        <Box className={styles.sidebarStyle}>
          <Stack space={[1, 2]}>
            <NavigateBack />
            {sidebar}
          </Stack>
        </Box>
        <Box className={styles.mainStyle}>{children}</Box>
      </Box>
    </GridContainer>
  )
}
