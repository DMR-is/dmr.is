import { useId, useState } from 'react'

import { Box, Button, Checkbox, Icon, Text } from '@island.is/island-ui/core'

import { FilterOption } from '../../context/filterContext'
import { messages } from '../../lib/messages'
import * as styles from '../filter-popover/FilterPopover.css'

type Props = {
  label: string
  expanded?: boolean
  filters: FilterOption[]
}

export const FilterGroup = ({ label, expanded, filters }: Props) => {
  const [localToggle, setLocalToggle] = useState(expanded)

  const localId = useId()

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
        {filters.map((filter, i) => (
          <Checkbox name={filter.label} key={i} label={filter.label} />
        ))}
        <Box display="flex" justifyContent="flexEnd">
          <Button size="small" variant="text" icon="reload" iconType="outline">
            {messages.general.clear_filter}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
