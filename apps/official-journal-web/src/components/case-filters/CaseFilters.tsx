import { useEffect, useState } from 'react'
import { useDebounce } from 'react-use'

import {
  Box,
  Button,
  Icon,
  Inline,
  Input,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import { handleFilterToggle } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'
import { messages } from './messages'

export type ActiveFilters = Array<{ key: string; value: string }>

export const CaseFilters = () => {
  const qp = useQueryParams()
  const { setSearchFilter, filterGroups, renderFilters } = useFilterContext()
  const { formatMessage } = useFormatMessage()
  const allFilters = filterGroups?.map((g) => g.options).flat()
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>([])

  const qs = qp.get('search') ?? ''

  const [localSearch, setLocalSearch] = useState(qs)

  const onStateUpdate = (value: string) => {
    setLocalSearch(value)
  }

  useEffect(() => {
    const filters: ActiveFilters = []
    Object.entries(qp.query).forEach(([key, values]) => {
      if (allFilters?.find((f) => f.key === key)) {
        const value = typeof values === 'string' ? values.split(',') : undefined
        value?.forEach((v) => {
          filters.push({ key, value: v })
        })
      }
    })
    setActiveFilters(filters)
  }, [qp.query])

  useDebounce(
    () => {
      setSearchFilter(localSearch)
      qp.add({ search: localSearch })
    },
    500,
    [localSearch],
  )

  if (!renderFilters) {
    return null
  }

  const resetFilters = () => {
    const keys = activeFilters.map((f) => f.key)
    setLocalSearch('')
    qp.remove(keys)
  }

  return (
    <Box>
      <Box className={styles.caseFilters}>
        <Input
          size="sm"
          icon={{ name: 'search', type: 'outline' }}
          backgroundColor="blue"
          name="filter"
          placeholder={formatMessage(messages.general.searchPlaceholder)}
          value={localSearch}
          onChange={(e) => onStateUpdate(e.target.value)}
        />
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
              {filterGroups.map((filter, i) => (
                <FilterGroup
                  key={i}
                  expanded={i === 0}
                  label={filter.label}
                  filters={filter.options}
                  activeFilters={activeFilters}
                />
              ))}
            </FilterPopover>
          </Popover>
        )}
      </Box>
      {activeFilters.length ? (
        <Box display="flex" marginTop={[2]} columnGap={1}>
          <Text whiteSpace="nowrap">
            {formatMessage(messages.general.filterLabel)}
          </Text>
          <Inline space={1}>
            {activeFilters.map((a) => {
              const target = allFilters?.find((f) => f.value === a.value)
              return (
                <Tag
                  key={a.value}
                  outlined
                  onClick={() => handleFilterToggle(qp, false, a.key, a.value)}
                >
                  <Box display="flex" alignItems="center" columnGap={1}>
                    {target?.label} <Icon icon="close" size="small" />
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
                onClick={resetFilters}
              >
                {formatMessage(messages.general.clearAllFilters)}
              </Button>
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}
