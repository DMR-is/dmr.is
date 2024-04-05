import { useEffect, useId, useState } from 'react'

import { Box, Button, Checkbox, Icon, Text } from '@island.is/island-ui/core'

import { FilterOption } from '../../context/filterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import * as styles from '../filter-popover/FilterPopover.css'
import { messages } from './messages'

type Props = {
  label: string
  expanded?: boolean
  filters: FilterOption[]
}

export const FilterGroup = ({ label, expanded, filters }: Props) => {
  const { formatMessage } = useFormatMessage()

  const [localToggle, setLocalToggle] = useState(expanded)

  const localId = useId()

  const { add, remove, get } = useQueryParams()

  const handleToggle = (toggle: boolean, key: string, value: string) => {
    const existingValue = get(key)
    if (existingValue && toggle) {
      add({ [key]: `${existingValue},${value}` })
    } else if (existingValue && !toggle) {
      const newValue = existingValue
        .split(',')
        .filter((v) => v !== value)
        .join(',')
      if (newValue) {
        add({ [key]: newValue })
      } else {
        remove([key])
      }
    } else if (toggle) {
      add({ [key]: value })
    } else {
      remove([key])
    }
  }

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
        {filters.map((filter, i) => {
          return (
            <Checkbox
              defaultChecked={get(filter.key)
                ?.split(',')
                .includes(filter.value)}
              onChange={(e) =>
                handleToggle(e.target.checked, filter.key, filter.value)
              }
              name={filter.label}
              key={i}
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
