import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { amountFormat } from '@dmr.is/utils-shared/format/number'

import { AddAdvertsToApplicationMenu } from '../../adverts/AddAdvertsToApplicationMenu'
import { BackButton } from '../../back-button/BackButton'
import * as styles from './Header.css'

type Props = {
  applicationId: string
  title: string
  description: string
  subtitle?: string
  showAddAdvertsButton?: boolean
  totalPrice?: number
  isPriceEstimate?: boolean
  isPriceLoading?: boolean
}

export const ApplicationSubmittedHeader = ({
  applicationId,
  title,
  description,
  subtitle,
  showAddAdvertsButton = false,
  totalPrice,
  // Nothing is confirmed until the price actually arrives, so default to the
  // estimate wording rather than claiming a definite cost
  isPriceEstimate = true,
  isPriceLoading = false,
}: Props) => {
  const fullTitle = `${title}${subtitle ? ` - ${subtitle}` : ''}`

  return (
    <Stack space={[2, 3, 4]}>
      <Box className={styles.titleStyles}>
        <Text variant="h2">{fullTitle}</Text>
        <BackButton href="/auglysingar" />
      </Box>
      {isPriceLoading ? (
        <SkeletonLoader height={24} width={220} borderRadius="standard" />
      ) : (
        <Inline space={1} alignY="center">
          <Text variant="eyebrow" color="purple400">
            {isPriceEstimate ? 'Áætlaður kostnaður' : 'Kostnaður'}
          </Text>
          <Text variant="h4">
            {/* amountFormat returns an empty string for a missing value */}
            {typeof totalPrice === 'number'
              ? amountFormat(totalPrice)
              : 'Ekki hægt að reikna'}
          </Text>
        </Inline>
      )}
      <Inline space={2} justifyContent="spaceBetween" alignY="center">
        <Text>{description}</Text>
        {showAddAdvertsButton && (
          <AddAdvertsToApplicationMenu applicationId={applicationId} />
        )}
      </Inline>
    </Stack>
  )
}
