import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'

import {
  Box,
  Button,
  Icon,
  Inline,
  Input,
  SkeletonLoader,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { useCaseOverview } from '../../hooks/api'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useIsMounted } from '../../hooks/useIsMounted'
import { useQueryParams } from '../../hooks/useQueryParams'
import { getStringFromQueryString } from '../../lib/types'
import { handleFilterToggle } from '../../lib/utils'
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
  const qp = useQueryParams()

  const router = useRouter()
  const isMounted = useIsMounted()
  const { isLoading } = useCaseOverview()

  const initialSearch = getStringFromQueryString(router.query.search)

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
    const status = getStringFromQueryString(router.query.status)
    router.push(
      {
        query: { status },
      },
      undefined,
      { shallow: true },
    )
  }

  const debouncedSearch = debounce(onSearchChange, 200)

  // TODO: get proper labels for these filters from FilterContext?
  const activeFilters: ActiveFilters = []
  Object.entries(qp.query).forEach(([key, val]) => {
    if (['department', 'category', 'type'].includes(key)) {
      const values = typeof val === 'string' ? val.split(',') : undefined
      values?.forEach((value) => {
        if (value) {
          activeFilters.push({ key, value })
        }
      })
    }
  })

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
      {activeFilters.length ? (
        <Box display="flex" marginTop={[2]} columnGap={1}>
          <Text whiteSpace="nowrap">Síun á lista:</Text>
          <Inline space={1}>
            {activeFilters.map((a) => {
              return (
                <Tag
                  key={a.value}
                  outlined
                  onClick={() => handleFilterToggle(qp, false, a.key, a.value)}
                >
                  <Box display="flex" alignItems="center" columnGap={1}>
                    {a?.value} <Icon icon="close" size="small" />
                  </Box>
                </Tag>
              )
            })}
          </Inline>
          {activeFilters.length > 1 ? (
            <Text whiteSpace="nowrap">
              <Button
                variant="text"
                size="small"
                icon="reload"
                onClick={() => {
                  const keys = activeFilters.map((f) => f.key)
                  qp.remove(keys)
                }}
              >
                Hreinsa allar síur
              </Button>
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}
