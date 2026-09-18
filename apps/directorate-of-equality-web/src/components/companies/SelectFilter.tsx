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
  /** Multi-select by default; pass false for single-value filters. */
  isMulti?: boolean
  onChange: (values: string[]) => void
}

// Searchable select filter — same control as the ÍSAT picker, but for option
// sets the parent already has in memory (regions, postcodes). Multi-select by
// default; single-select mode still reports its value as a 0/1-length array so
// the parent handler stays uniform.
export const SelectFilter = ({
  name,
  label,
  placeholder,
  noOptionsMessage,
  options,
  selected,
  isLoading,
  isMulti = true,
  onChange,
}: Props) => {
  const value = useMemo(() => {
    const resolve = (v: string) =>
      options.find((o) => o.value === v) ?? { value: v, label: v }
    if (isMulti) {
      return selected.map(resolve)
    }
    return selected.length ? resolve(selected[0]) : null
  }, [selected, options, isMulti])

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
        isMulti={isMulti}
        isSearchable
        isClearable
        isLoading={isLoading}
        options={options}
        value={value}
        placeholder={placeholder}
        noOptionsMessage={noOptionsMessage}
        onChange={(opts: unknown) => {
          if (isMulti) {
            onChange(
              ((opts as SelectFilterOption[] | null) ?? []).map((o) => o.value),
            )
          } else {
            const opt = opts as SelectFilterOption | null
            onChange(opt ? [opt.value] : [])
          }
        }}
      />
    </Box>
  )
}
