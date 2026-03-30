'use client'

import { Box } from '../../island-is/lib/Box'
import { Button } from '../../island-is/lib/Button'
import { DatePicker } from '../../island-is/lib/DatePicker'
import { Select, type StringOption } from '../../island-is/lib/Select'
import * as styles from './SearchDashboard.css'
import { SearchDashboardPanel } from './SearchDashboardPanel'
import type { SearchDashboardFiltersProps } from './types'

const parseDateValue = (value: string) => {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? undefined : date
}

const formatDateValue = (date: Date) => {
  return date.toISOString().slice(0, 10)
}

export const SearchDashboardFilters = ({
  title = 'Síur',
  helpText,
  fromLabel = 'Frá',
  toLabel = 'Til',
  presetLabel = 'Tímabil',
  resetLabel = 'Hreinsa',
  values,
  presets = [],
  onFromChange,
  onToChange,
  onPresetChange,
  onReset,
}: SearchDashboardFiltersProps) => {
  const fromDate = parseDateValue(values.from)
  const toDate = parseDateValue(values.to)
  const presetOptions: StringOption[] = presets.map((preset) => ({
    label: preset.label,
    value: preset.value,
  }))
  const selectedPreset =
    presetOptions.find((preset) => preset.value === values.preset) ?? null
  const resetAction = onReset ? (
    <Button
      icon="reload"
      iconType="outline"
      size="small"
      variant="text"
      onClick={onReset}
    >
      {resetLabel}
    </Button>
  ) : null

  return (
    <SearchDashboardPanel title={title} helpText={helpText} action={resetAction}>
      <Box className={styles.filtersLayout}>
        <Box className={styles.filterInputs}>
          <DatePicker
            backgroundColor="blue"
            handleChange={(date) => onFromChange(formatDateValue(date))}
            label={fromLabel}
            locale="is"
            maxDate={toDate}
            name="search-dashboard-from"
            placeholderText=""
            selected={fromDate}
            size="sm"
          />
          <DatePicker
            backgroundColor="blue"
            handleChange={(date) => onToChange(formatDateValue(date))}
            label={toLabel}
            locale="is"
            minDate={fromDate}
            name="search-dashboard-to"
            placeholderText=""
            selected={toDate}
            size="sm"
          />
        </Box>
        {presets.length > 0 && onPresetChange ? (
          <Box className={styles.presetField}>
            <Select
              backgroundColor="blue"
              hideClearIndicator
              label={presetLabel}
              name="search-dashboard-preset"
              onChange={(option) => {
                if (!option) {
                  return
                }

                onPresetChange(option.value)
              }}
              options={presetOptions}
              placeholder="Veldu tímabil"
              size="sm"
              value={selectedPreset}
            />
          </Box>
        ) : null}
      </Box>
    </SearchDashboardPanel>
  )
}
