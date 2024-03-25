import { Box, Button, Input } from '@island.is/island-ui/core'
import * as styles from './CaseFilters.css'
import { useFilterContext } from '../../hooks/useFilterContext'
import { Popover } from '../popover/Popover'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { messages } from '../../lib/messages'
import { useState } from 'react'
import { useDebounce } from 'react-use'
import { useQueryParams } from '../../hooks/useQueryParams'

export const CaseFilters = () => {
  const { add, get } = useQueryParams()
  const { setSearchFilter } = useFilterContext()

  const qs = get('search') ?? ''

  const [localSearch, setLocalSearch] = useState(qs)

  const onStateUpdate = (value: string) => {
    setLocalSearch(value)
    add({ search: value })
  }

  useDebounce(
    () => {
      setSearchFilter(localSearch)
    },
    500,
    [localSearch],
  )

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
      <Popover
        disclosure={
          <Button variant="utility" icon="filter">
            {messages.general.open_filter}
          </Button>
        }
      >
        <FilterPopover />
      </Popover>
    </Box>
  )
}
