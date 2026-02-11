import { useId, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { LoadingDots } from '@island.is/island-ui/core/LoadingDots/LoadingDots'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from '../filter-popover/FilterPopover.css'
import { messages } from './messages'

type Props = {
  label: string
  loading?: boolean
  options: { title: string }[]
  filters: string[] | null
  setFilters: (f: string[] | null) => void
  search?: string
  searchPlaceholder?: string
  setSearch?: (search: string) => void
  startExpanded?: boolean
}

export const FilterGroup = ({
  label,
  options,
  search,
  searchPlaceholder,
  filters,
  setFilters,
  setSearch,
  loading,
  startExpanded = false,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const localId = useId()

  const [toggle, setToggle] = useState(startExpanded)

  const nonDuplicateOptions =
    options?.flatMap((type, index) => {
      return options.findIndex((t) => t.title === type.title) === index
        ? [{ label: type.title, value: type.title }]
        : []
    }) ?? []

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
        {nonDuplicateOptions.map((filter, index) => {
          const isChecked = filters?.includes(filter.value)
          return (
            <Checkbox
              checked={isChecked}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilters([...(filters || []), filter.value])
                } else if (filters?.length === 1) {
                  // We reset to null when the last filter is removed
                  setFilters(null)
                } else {
                  setFilters([
                    ...(filters || []).filter((f) => f !== filter.value),
                  ])
                }
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
            onClick={() => {
              setFilters([])
            }}
          >
            {formatMessage(messages.general.clearFilter)}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
