import { Box, Icon, Text } from '@island.is/island-ui/core'

import { FilterGroup } from '../../context/filterContext'
import { useFilterContext } from '../../hooks/useFilterContext'
import { messages } from '../../lib/messages'
import * as styles from './FilterPopover.css'

type Props = {
  children?: React.ReactElement<FilterGroup>[]
}

export const FilterPopover = ({ children }: Props) => {
  const { setSearchFilter } = useFilterContext()

  const resetAllFilters = () => {
    setSearchFilter('')
  }

  return (
    <Box className={styles.filterPopover}>
      <Box className={styles.filterPopoverFilters}>{children}</Box>
      <Box className={styles.resetAllButtonWrapper}>
        <button onClick={resetAllFilters} className={styles.resetAllButton}>
          <Box className={styles.resetAllButtonContent}>
            <Text fontWeight="semiBold" variant="small" color="blue400">
              {messages.general.clear_filters}
            </Text>
            <Icon size="small" icon="reload" color="blue400" />
          </Box>
        </button>
      </Box>
    </Box>
  )
}
