import { Dispatch, SetStateAction, useId, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Icon,
  Input,
  Text,
} from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from '../filter-popover/FilterPopover.css'
import { messages } from './messages'

type Props = {
  label: string
  queryKey: string
  options: { label: string; value: string }[]
  search?: string
  searchPlaceholder?: string
  setSearch?: Dispatch<SetStateAction<string>>
  loading?: boolean
  startExpanded?: boolean
}

export const FilterGroup = ({
  queryKey,
  label,
  options,
  search,
  searchPlaceholder,
  setSearch,
  loading,
  startExpanded = false,
}: Props) => {
  const { formatMessage } = useFormatMessage()
  const { filterState, toggleFilter, clearFilter } = useFilterContext()

  const localId = useId()

  const [toggle, setToggle] = useState(startExpanded)

  const clearGroup = () => {
    clearFilter(queryKey)
  }

  return (
    <Box className={styles.filterExpandButtonWrapper}>
      <button
        aria-expanded={toggle ? 'true' : 'false'}
        aria-controls={localId}
        onClick={() => {
          if (setToggle) {
            setToggle(!toggle)
          }
        }}
        className={styles.filterExpandButton}
      >
        <Text color="dark400" variant="h5">
          {label}
        </Text>
        <Box className={styles.filterExpandButtonIcon}>
          <Icon icon={toggle ? 'remove' : 'add'} color="blue400" size="small" />
        </Box>
      </button>
      <Box id={localId} className={styles.filterGroup({ expanded: toggle })}>
        {search !== undefined && setSearch !== undefined && (
          <Box marginBottom={2}>
            <Input
              loading={loading}
              backgroundColor="blue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="xs"
              name="typeSearch"
              placeholder={
                searchPlaceholder
                  ? searchPlaceholder
                  : formatMessage(messages.general.search)
              }
            />
          </Box>
        )}
        {options.map((filter, index) => {
          const isChecked = !!filterState.activeFilters.find(
            (f) => f.key === queryKey && f.slug === filter.value,
          )
          return (
            <Checkbox
              checked={isChecked}
              onChange={(e) => {
                toggleFilter(
                  e.target.checked,
                  queryKey,
                  filter.value,
                  filter.label,
                )
              }}
              name={filter.label}
              key={index}
              label={filter.label}
            />
          )
        })}
        <Box display="flex" justifyContent="flexEnd">
          <Button
            size="small"
            variant="text"
            icon="reload"
            as="button"
            iconType="outline"
            onClick={clearGroup}
          >
            {formatMessage(messages.general.clearFilter)}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
