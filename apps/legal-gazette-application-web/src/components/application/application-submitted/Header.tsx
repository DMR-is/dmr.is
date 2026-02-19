import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { AddAdvertsToApplicationMenu } from '../../adverts/AddAdvertsToApplicationMenu'
import { BackButton } from '../../back-button/BackButton'
import * as styles from './Header.css'

type Props = {
  applicationId: string
  title: string
  description: string
  subtitle?: string
  showAddAdvertsButton?: boolean
}

export const ApplicationSubmittedHeader = ({
  applicationId,
  title,
  description,
  subtitle,
  showAddAdvertsButton = false,
}: Props) => {
  const fullTitle = `${title}${subtitle ? ` - ${subtitle}` : ''}`

  return (
    <Stack space={[2, 3, 4]}>
      <Box className={styles.titleStyles}>
        <Text variant="h2">{fullTitle}</Text>
        <BackButton href="/auglysingar" />
      </Box>
      <Inline space={2} justifyContent="spaceBetween" alignY="center">
        <Text>{description}</Text>
        {showAddAdvertsButton && (
          <AddAdvertsToApplicationMenu applicationId={applicationId} />
        )}
      </Inline>
    </Stack>
  )
}
