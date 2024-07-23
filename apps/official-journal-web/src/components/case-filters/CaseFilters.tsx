import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

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
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'
import { CategoriesFilter } from './CategoriesFilter'
import { DepartmentsFilter } from './DepartmentsFilter'
import { messages } from './messages'
import { TypesFilter } from './TypesFilter'

export const CaseFilters = () => {
  const { formatMessage } = useFormatMessage()
  const router = useRouter()
  const isMounted = useIsMounted()
  const { isLoading } = useCaseOverview()
  const qp = useQueryParams()

  const initialSearch = getStringFromQueryString(router.query.search)

  const { filterState, clearFilter } = useFilterContext()

  const shouldShowFilters =
    filterState.enableCategories ||
    filterState.enableDepartments ||
    filterState.enableTypes

  const onSearchChange = (value: string) => {
    router.push(
      {
        query: { ...router.query, search: value },
      },
      undefined,
      { shallow: true },
    )
  }

  const debouncedSearch = debounce(onSearchChange, 200)

  useEffect(() => {
    const status = qp.get('status')

    const filterParams: Record<string, string> = {}
    filterState.activeFilters.forEach((f) => {
      if (!filterParams[f.key]) {
        filterParams[f.key] = f.slug
      } else {
        filterParams[f.key] += ',' + f.slug
      }
    })

    router.push(
      {
        query: { status, ...filterParams },
      },
      undefined,
      { shallow: true },
    )
  }, [filterState.activeFilters])

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
            <FilterPopover resetFilters={clearFilter}>
              {filterState.enableTypes && <TypesFilter />}
              {filterState.enableDepartments && <DepartmentsFilter />}
              {filterState.enableCategories && <CategoriesFilter />}
            </FilterPopover>
          </Popover>
        )}
      </Box>
      {filterState.activeFilters.length ? (
        <Box display="flex" marginTop={[2]} columnGap={1}>
          <Text whiteSpace="nowrap">Síun á lista:</Text>
          <Inline space={1}>
            {filterState.activeFilters.map((a) => {
              return (
                <Tag
                  key={a.slug}
                  outlined
                  onClick={() => clearFilter(a.key, a.slug)}
                >
                  <Box display="flex" alignItems="center" columnGap={1}>
                    {a.label} <Icon icon="close" size="small" />
                  </Box>
                </Tag>
              )
            })}
          </Inline>
          {filterState.activeFilters.length > 1 ? (
            <Text whiteSpace="nowrap">
              <Button
                variant="text"
                size="small"
                icon="reload"
                onClick={() => {
                  clearFilter()
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
