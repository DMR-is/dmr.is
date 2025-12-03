import { Box, Button, Inline, LinkV2 } from '@dmr.is/ui/components/island-is'

import { PageRoutes } from '../../../lib/constants'
import * as styles from './application-footer.css'

export const ApplicationFooter = () => {
  return (
    <Box
      paddingY={[3, 5]}
      paddingX={[9, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      <Inline justifyContent="spaceBetween" alignY="center">
        <LinkV2 href={PageRoutes.APPLICATIONS}>
          <Button preTextIcon="arrowBack" variant="ghost">
            Yfirlit
          </Button>
        </LinkV2>
        <Button type="submit" icon="arrowForward">
          Senda til birtingar
        </Button>
      </Inline>
    </Box>
  )
}
