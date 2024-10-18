import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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
  const qp = useQueryParams()

  const initialSearch = getStringFromQueryString(router.query.search)
  const [search, setSearch] = useState(initialSearch)

  const { filterState, clearFilter } = useFilterContext()

  const shouldShowFilters =
    filterState.enableCategories ||
    filterState.enableDepartments ||
    filterState.enableTypes

  const debouncedSearch = debounce(setSearch, 200)

  useEffect(() => {
    const filterParams: Record<string, string> = {}

    const status = qp.get('status')
    status && (filterParams['status'] = status)
    search && (filterParams['search'] = search)

    filterState.activeFilters.forEach((f) => {
      if (!filterParams[f.key]) {
        filterParams[f.key] = f.slug
      } else {
        filterParams[f.key] += ',' + f.slug
      }
    })

    router.replace(
      {
        query: { ...filterParams },
      },
      undefined,
      { shallow: true },
    )
  }, [filterState.activeFilters, search])

  const clearFilters = () => {
    setSearch('')
    clearFilter()
  }

  return (
    <Box>
      <Box className={styles.caseFilters}>
        {isMounted ? (
          <Input
            size="sm"
            icon={{ name: 'search', type: 'outline' }}
            backgroundColor="blue"
            name="filter"
            defaultValue={search}
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
            {filterState.activeFilters
              .map((a) => {
                if (!a.label) {
                  return null
                }
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
              })
              .filter(Boolean)}
          </Inline>
          {filterState.activeFilters.length > 1 ? (
            <Text whiteSpace="nowrap">
              <Button
                variant="text"
                size="small"
                icon="reload"
                onClick={() => {
                  clearFilters()
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
