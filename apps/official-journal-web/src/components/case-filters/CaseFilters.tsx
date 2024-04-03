import { useState } from 'react'
import { useDebounce } from 'react-use'

import { Box, Button, Input } from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilterContext'
import { useQueryParams } from '../../hooks/useQueryParams'
import { messages } from '../../lib/messages'
import { FilterGroup } from '../filter-group/FilterGroup'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'

export const CaseFilters = () => {
  const { add, get } = useQueryParams()
  const { setSearchFilter, filterGroups, renderFilters } = useFilterContext()

  const qs = get('search') ?? ''

  const [localSearch, setLocalSearch] = useState(qs)

  const onStateUpdate = (value: string) => {
    setLocalSearch(value)
  }

  console.log(renderFilters)

  useDebounce(
    () => {
      setSearchFilter(localSearch)
      add({ search: localSearch })
    },
    500,
    [localSearch],
  )

  if (!renderFilters) {
    return null
  }

  return (
    <Box className={styles.caseFilters}>
      <Input
        size="sm"
        icon={{ name: 'search', type: 'outline' }}
        backgroundColor="blue"
        name="filter"
        placeholder="Leita eftir málsnafni"
        value={localSearch}
        onChange={(e) => onStateUpdate(e.target.value)}
      />
      {filterGroups?.length && (
        <Popover
          disclosure={
            <Button variant="utility" icon="filter">
              {messages.general.open_filter}
            </Button>
          }
        >
          <FilterPopover>
            {filterGroups.map((filter, i) => (
              <FilterGroup
                key={i}
                expanded={i === 0}
                label={filter.label}
                filters={filter.options}
              />
            ))}
          </FilterPopover>
        </Popover>
      )}
    </Box>
  )
}
