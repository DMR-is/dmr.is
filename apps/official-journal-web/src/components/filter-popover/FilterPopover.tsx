import { Box, Icon, Text } from '@island.is/island-ui/core'

import { FilterGroup } from '../../context/filterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './FilterPopover.css'
import { messages } from './messages'

type Props = {
  children?: React.ReactElement<FilterGroup>[]
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
