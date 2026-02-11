import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './FilterPopover.css'
import { messages } from './messages'

type Props = {
  children?: React.ReactNode
  resetFilters?: () => void
}

export const FilterPopover = ({ children, resetFilters }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <Box className={styles.filterPopover}>
      <Box className={styles.filterPopoverFilters}>{children}</Box>
      <Box className={styles.resetAllButtonWrapper}>
        <button onClick={resetFilters} className={styles.resetAllButton}>
          <Box className={styles.resetAllButtonContent}>
            <Text fontWeight="semiBold" variant="small" color="blue400">
              {formatMessage(messages.general.clearAllFilters)}
            </Text>
            <Icon size="small" icon="reload" color="blue400" />
          </Box>
        </button>
      </Box>
    </Box>
  )
}
