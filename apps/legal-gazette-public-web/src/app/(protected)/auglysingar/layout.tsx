import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
import { Box, GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { NavigateBack } from '../../../components/client-components/navigate-back/NavigateBack'
import { getBaseUrlFromServerSide } from '../../../lib/utils'
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
  const baseUrl = getBaseUrlFromServerSide()

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
            <Stack space={[1, 2]}>{children}</Stack>
          </Box>
        </Box>
      </GridContainer>
      {related && <Box>{related}</Box>}
      <LGFooter baseUrl={baseUrl} />
    </>
  )
}
