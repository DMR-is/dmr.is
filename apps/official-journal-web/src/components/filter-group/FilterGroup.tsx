import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from 'next-usequerystate'
import { Dispatch, SetStateAction, useId, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Icon,
  Inline,
  Input,
  LoadingDots,
  Text,
} from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from '../filter-popover/FilterPopover.css'
import { messages } from './messages'

type Props = {
  label: string
  queryKey: string
  loading?: boolean
  options: { label: string; value: string }[]
  search?: string
  searchPlaceholder?: string
  setSearch?: Dispatch<SetStateAction<string>>
  setPage: Dispatch<SetStateAction<number>>
  startExpanded?: boolean
}

export const FilterGroup = ({
  queryKey,
  label,
  options,
  search,
  searchPlaceholder,
  setSearch,
  setPage,
  loading,
  startExpanded = false,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const localId = useId()

  const [toggle, setToggle] = useState(startExpanded)

  const [filters, setFilters] = useQueryState(
    queryKey,
    parseAsArrayOf(parseAsString, ','),
  )

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
        <Inline alignY="center" space={1}>
          {loading && <LoadingDots single large={false} />}
          <Text color="dark400" variant="h5">
            {label}
          </Text>
        </Inline>
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
          const isChecked = filters?.includes(filter.value)
          return (
            <Checkbox
              checked={isChecked}
              onChange={(e) => {
                e.target.checked
                  ? setFilters([...(filters || []), filter.value])
                  : setFilters([
                      ...(filters || []).filter((f) => f !== filter.value),
                    ])
                setPage(1)
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
            onClick={() => setFilters([])}
          >
            {formatMessage(messages.general.clearFilter)}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
