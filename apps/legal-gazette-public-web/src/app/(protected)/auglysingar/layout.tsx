import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import { Box, GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { Breadcrumbs } from '../../../components/client-components/breadcrumbs/Breadcrumbs'
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
      <GridContainer>
        <Box paddingY={8} className={styles.gridLayout}>
          <Box className={styles.sidebarStyle}>
            <Stack space={[1, 2]}>
              <NavigateBack />
              {sidebar}
            </Stack>
          </Box>
          <Box className={styles.mainStyle}>
            <Stack space={[1, 2]}>
              <Breadcrumbs />
              {children}
            </Stack>
          </Box>
        </Box>
      </GridContainer>
      {related && <Box>{related}</Box>}
      <Footer />
    </>
  )
}
