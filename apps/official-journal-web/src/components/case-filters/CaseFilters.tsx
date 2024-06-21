import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'

import { Box, Button, Input, SkeletonLoader } from '@island.is/island-ui/core'

import { useCaseOverview } from '../../hooks/api'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useIsMounted } from '../../hooks/useIsMounted'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'
import { CategoriesFilter } from './CategoriesFilter'
import { DepartmentsFilter } from './DepartmentsFilter'
import { messages } from './messages'
import { TypesFilter } from './TypesFilter'

export type ActiveFilters = Array<{ key: string; value: string }>

export const CaseFilters = () => {
  const { formatMessage } = useFormatMessage()

  const router = useRouter()
  const isMounted = useIsMounted()
  const { isLoading } = useCaseOverview()

  const initialSearch = router.query.search as string | undefined

  const { enableCategories, enableDepartments, enableTypes } =
    useFilterContext()

  const shouldShowFilters = enableCategories || enableDepartments || enableTypes

  const onSearchChange = (value: string) => {
    router.push(
      {
        query: { ...router.query, search: value },
      },
      undefined,
      { shallow: true },
    )
  }

  const clearFilters = () => {
    const status = router.query.status
    router.push(
      {
        query: { status },
      },
      undefined,
      { shallow: true },
    )
  }

  const debouncedSearch = debounce(onSearchChange, 200)

  return (
    <Box>
      <Box className={styles.caseFilters}>
        {isMounted ? (
          <Input
            loading={isLoading}
            size="sm"
            icon={{ name: 'search', type: 'outline' }}
            backgroundColor="blue"
            name="filter"
            defaultValue={initialSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder={formatMessage(messages.general.searchPlaceholder)}
          />
        ) : (
          <SkeletonLoader height={44} />
        )}
        {shouldShowFilters && (
          <Popover
            label={formatMessage(messages.general.filters)}
            disclosure={
              <Button variant="utility" icon="filter">
                {formatMessage(messages.general.openFilter)}
              </Button>
            }
          >
            <FilterPopover resetFilters={clearFilters}>
              {enableTypes && <TypesFilter />}
              {enableDepartments && <DepartmentsFilter />}
              {enableCategories && <CategoriesFilter />}
            </FilterPopover>
          </Popover>
        )}
      </Box>
    </Box>
  )
}
