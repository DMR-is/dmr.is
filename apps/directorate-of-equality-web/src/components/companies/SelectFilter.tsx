'use client'

import { useMemo } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export type SelectFilterOption = { value: string; label: string }

type Props = {
  name: string
  /** Optional heading; omit when the surrounding accordion row supplies it. */
  label?: string
  placeholder?: string
  noOptionsMessage?: string
  options: SelectFilterOption[]
  selected: string[]
  isLoading?: boolean
  onChange: (values: string[]) => void
}

// Searchable multi-select filter — same control as the ÍSAT picker, but for
// option sets the parent already has in memory (regions, postcodes).
export const SelectFilter = ({
  name,
  label,
  placeholder,
  noOptionsMessage,
  options,
  selected,
  isLoading,
  onChange,
}: Props) => {
  const value = useMemo(
    () =>
      selected.map(
        (v) => options.find((o) => o.value === v) ?? { value: v, label: v },
      ),
    [selected, options],
  )

  return (
    <Box>
      {label && (
        <Text variant="eyebrow" marginBottom={1}>
          {label}
        </Text>
      )}
      <Select
        name={name}
        size="sm"
        isMulti
        isSearchable
        isClearable
        isLoading={isLoading}
        options={options}
        value={value}
        placeholder={placeholder}
        noOptionsMessage={noOptionsMessage}
        onChange={(opts: unknown) =>
          onChange(
            ((opts as SelectFilterOption[] | null) ?? []).map((o) => o.value),
          )
        }
      />
    </Box>
  )
}
