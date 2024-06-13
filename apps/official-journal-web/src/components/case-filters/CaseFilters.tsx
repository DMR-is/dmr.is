import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import React from 'react'

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

import { useCaseOverview } from '../../hooks/useCaseOverview'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useIsMounted } from '../../hooks/useIsMounted'
import { FilterGroup } from '../filter-group/FilterGroup'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'
import { messages } from './messages'

export type ActiveFilters = Array<{ key: string; value: string }>

export const CaseFilters = () => {
  const { formatMessage } = useFormatMessage()
  const { filterGroups } = useFilterContext()
  const router = useRouter()
  const isMounted = useIsMounted()

  const initialSearch = router.query.search as string | undefined

  const { isLoading } = useCaseOverview()

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

  const resetFilters = () => {
    console.log('reset filters')
  }

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
        {filterGroups?.length && (
          <Popover
            label={formatMessage(messages.general.filters)}
            disclosure={
              <Button variant="utility" icon="filter">
                {formatMessage(messages.general.openFilter)}
              </Button>
            }
          >
            <FilterPopover resetFilters={resetFilters}>
              {filterGroups.map((filter, i) => {
                return (
                  <React.Fragment key={i}>
                    <FilterGroup {...filter} />
                  </React.Fragment>
                )
              })}
            </FilterPopover>
          </Popover>
        )}
      </Box>
    </Box>
  )
}
