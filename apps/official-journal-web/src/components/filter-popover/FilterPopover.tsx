import { Box, Icon, Text } from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilterContext'
import { messages } from '../../lib/messages'
import { FilterGroups } from './FilterGroups'
import * as styles from './FilterPopover.css'

export const FilterPopover = () => {
  const {
    setCategoriesFilterOptions,
    setDepartmentFilterOptions,
    setPublishingFilterOptions,
    setSearchFilter,
    setTypeFilterOptions,
  } = useFilterContext()

  const resetAllFilters = () => {
    setSearchFilter('')
    setTypeFilterOptions([])
    setCategoriesFilterOptions([])
    setDepartmentFilterOptions([])
    setPublishingFilterOptions([])
  }

  return (
    <Box className={styles.filterPopover}>
      <Box className={styles.filterPopoverFilters}>
        <FilterGroups />
      </Box>
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
