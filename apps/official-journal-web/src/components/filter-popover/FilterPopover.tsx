import { Box, Icon, Text } from '@island.is/island-ui/core'
import { useFilterContext } from '../../hooks/useFilterContext'
import * as styles from './FilterPopover.css'
import { FilterGroups } from './FilterGroups'

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
              Hreinsa allar síur
            </Text>
            <Icon size="small" icon="reload" color="blue400" />
          </Box>
        </button>
      </Box>
    </Box>
  )
}
