import { Box, Button, Input } from '@island.is/island-ui/core'
import * as styles from './CaseFilters.css'
import { useFilterContext } from '../../hooks/useFilterContext'
import { Popover } from '../popover/Popover'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { messages } from '../../lib/messages'

export const CaseFilters = () => {
  const { setSearchFilter, searchFilter } = useFilterContext()

  return (
    <Box className={styles.caseFilters}>
      <Input
        size="sm"
        icon={{ name: 'search', type: 'outline' }}
        backgroundColor="blue"
        name="filter"
        placeholder="Leita eftir málsnafni"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
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
