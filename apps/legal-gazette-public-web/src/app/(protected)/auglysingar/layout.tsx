import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { NavigateBack } from '../../../components/client-components/navigate-back/NavigateBack'
import * as styles from './grid-layout.css'

export default async function Layout({
  children,
  sidebar,
  related,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  related: React.ReactNode
}) {
  return (
    <>
      <GridContainer className="print-hidden">
        <Box paddingY={8} className={styles.gridLayout}>
          <Box className={styles.sidebarStyle}>
            <Stack space={[1, 2]}>
              <NavigateBack />
              {sidebar}
            </Stack>
          </Box>
          <Box className={styles.mainStyle}>
            <Stack space={[1, 2]}>{children}</Stack>
          </Box>
        </Box>
      </GridContainer>
      {related && <Box>{related}</Box>}
    </>
  )
}
