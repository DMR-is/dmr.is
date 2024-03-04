import { Box, GridContainer, Text } from '@island.is/island-ui/core'
import { theme } from '@island.is/island-ui/theme'
import useIsMobile from '../../hooks/useIsMobile'

import * as styles from './Banner.css'

export const Banner = () => {
  const { isMobile } = useIsMobile()

  return (
    <Box
      style={{
        borderBottom: `1px solid ${theme.color.blue200}`,
      }}
      background="blue100"
      display="flex"
      flexDirection={'column'}
    >
      <GridContainer>
        <Box className={styles.contentWrapper}>
          <Text>Stjórnartíðindi</Text>
        </Box>
        <Box className={styles.imageWrapper}></Box>
      </GridContainer>
    </Box>
  )
}
