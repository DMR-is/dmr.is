import { useId, useState } from 'react'

import { Box, Button, Checkbox, Icon, Text } from '@island.is/island-ui/core'

import { FilterOption } from '../../context/filterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import { handleFilterToggle } from '../../lib/utils'
import { ActiveFilters } from '../case-filters/CaseFilters'
import * as styles from '../filter-popover/FilterPopover.css'
import { messages } from './messages'

type Props = {
  label: string
  expanded?: boolean
  filters: FilterOption[]
  activeFilters: ActiveFilters
}

export const FilterGroup = ({
  label,
  expanded,
  filters,
  activeFilters,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const [localToggle, setLocalToggle] = useState(expanded)

  const localId = useId()

  const qp = useQueryParams()

  return (
    <Box className={styles.filterExpandButtonWrapper}>
      <button
        aria-expanded={localToggle ? 'true' : 'false'}
        aria-controls={localId}
        onClick={() => setLocalToggle(!localToggle)}
        className={styles.filterExpandButton}
      >
        <Text color="dark400" variant="h5">
          {label}
        </Text>
        <Box className={styles.filterExpandButtonIcon}>
          <Icon
            icon={localToggle ? 'remove' : 'add'}
            color="blue400"
            size="small"
          />
        </Box>
      </button>
      <Box
        id={localId}
        className={styles.filterGroup({ expanded: localToggle })}
      >
        {filters.map((filter) => {
          return (
            <Checkbox
              checked={!!activeFilters.find((a) => a.value === filter.value)}
              onChange={(e) =>
                handleFilterToggle(
                  qp,
                  e.target.checked,
                  filter.key,
                  filter.value,
                )
              }
              name={filter.label}
              key={filter.value}
              label={filter.label}
            />
          )
        })}
        <Box display="flex" justifyContent="flexEnd">
          <Button size="small" variant="text" icon="reload" iconType="outline">
            {formatMessage(messages.general.clearFilter)}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
