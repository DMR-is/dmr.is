'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { RadioButton } from '@dmr.is/ui/components/island-is/RadioButton'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../hooks/useIsMobile'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, sharedText } from '../../lib/text'
import { EMPLOYEE_RANGES } from '../../lib/utils'
import {
  DAILY_FINES_FILTER_OPTIONS,
  EXPIRES_FILTER_OPTIONS,
  OVERDUE_FILTER_OPTIONS,
  QUARANTINE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './companyStatus'
import { IsatCategoryFilter } from './IsatCategoryFilter'
import { SelectFilter } from './SelectFilter'

export type FilterOption = { value: string; label: string }

export type CompanyFilters = {
  employees: string[]
  status: string[]
  expires: string[]
  dailyFines: string[]
  overdue: string[]
  quarantined: string[]
  regionCode: string[]
  postcode: string[]
  isatCategoryCode: string[]
}

type Category = {
  id: keyof CompanyFilters
  label: string
  selected: string[]
  filters: FilterOption[]
  singleOption?: boolean
}

type Props = {
  query: string
  onQueryChange: (val: string) => void
  filters: CompanyFilters
  onFiltersChange: (key: keyof CompanyFilters, val: string[]) => void
  onReset: () => void
  regionOptions: FilterOption[]
  postcodeOptions: FilterOption[]
}

export const CompanyFilter = ({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onReset,
  regionOptions,
  postcodeOptions,
}: Props) => {
  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  // Checkbox/radio categories. The select-based filters (region, postcode,
  // ÍSAT) are rendered as their own accordion rows below, in the same card.
  const categories: Category[] = [
    {
      id: 'employees',
      label: companiesText.avgEmployeeCount,
      selected: filters.employees,
      filters: EMPLOYEE_RANGES,
      singleOption: true,
    },
    {
      id: 'status',
      label: sharedText.statusLabel,
      selected: filters.status,
      filters: STATUS_FILTER_OPTIONS,
    },
    {
      id: 'expires',
      label: companiesText.validPeriod,
      selected: filters.expires,
      filters: EXPIRES_FILTER_OPTIONS,
    },
    {
      id: 'dailyFines',
      label: companiesText.dailyFines,
      selected: filters.dailyFines,
      filters: DAILY_FINES_FILTER_OPTIONS,
    },
    {
      id: 'overdue',
      label: companiesText.overdue,
      selected: filters.overdue,
      filters: OVERDUE_FILTER_OPTIONS,
    },
    {
      id: 'quarantined',
      label: companiesText.quarantine,
      selected: filters.quarantined,
      filters: QUARANTINE_FILTER_OPTIONS,
    },
  ]

  const toggle = (category: Category, value: string, checked: boolean) => {
    const next = category.singleOption
      ? checked
        ? [value]
        : []
      : checked
        ? [...category.selected, value]
        : category.selected.filter((v) => v !== value)
    onFiltersChange(category.id, next)
  }

  const labelColor = (selected: string[]) =>
    selected.length > 0 ? 'blue400' : 'currentColor'

  const clearButton = (id: keyof CompanyFilters, selected: string[]) =>
    selected.length > 0 ? (
      <Box textAlign="right">
        <Button
          icon="reload"
          size="small"
          variant="text"
          onClick={() => onFiltersChange(id, [])}
        >
          {sharedText.filter.labelClear}
        </Button>
      </Box>
    ) : null

  return (
    <>
      {!isMobile && (
        <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
          {companiesText.filterHeading}
        </Text>
      )}
      <Filter
        labelClearAll={sharedText.filter.labelClearAll}
        labelOpen={sharedText.filter.labelOpen}
        labelClose={sharedText.filter.labelClose}
        labelClear={sharedText.filter.labelClear}
        labelTitle={sharedText.filter.labelTitle}
        labelResult={sharedText.filter.labelResult}
        onFilterClear={onReset}
        variant={isTablet ? 'popover' : 'default'}
        filterInput={
          <FilterInput
            name="query"
            placeholder={companiesText.filterPlaceholder}
            value={query}
            onChange={onQueryChange}
            backgroundColor="white"
          />
        }
      >
        <Box paddingX={3} paddingY={1} borderRadius="large" background="white">
          <Accordion
            space={3}
            dividerOnBottom={false}
            dividerOnTop={false}
            singleExpand={false}
          >
            {categories.map((category) => (
              <AccordionItem
                key={category.id}
                id={category.id}
                label={category.label}
                labelUse="h5"
                labelVariant="h5"
                labelColor={labelColor(category.selected)}
                iconVariant="small"
              >
                <Stack space={2}>
                  <Stack space={2}>
                    {category.filters.map((filter) =>
                      category.singleOption ? (
                        <RadioButton
                          key={`${category.id}-${filter.value}`}
                          name={`${category.id}-${filter.value}`}
                          label={filter.label}
                          value={filter.value}
                          checked={category.selected.includes(filter.value)}
                          onChange={(e) =>
                            toggle(category, filter.value, e.target.checked)
                          }
                        />
                      ) : (
                        <Checkbox
                          key={`${category.id}-${filter.value}`}
                          name={`${category.id}-${filter.value}`}
                          label={filter.label}
                          value={filter.value}
                          checked={category.selected.includes(filter.value)}
                          onChange={(e) =>
                            toggle(category, filter.value, e.target.checked)
                          }
                        />
                      ),
                    )}
                  </Stack>
                  {clearButton(category.id, category.selected)}
                </Stack>
              </AccordionItem>
            ))}

            <AccordionItem
              id="location"
              label={companiesText.location}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor([
                ...filters.regionCode,
                ...filters.postcode,
              ])}
              iconVariant="small"
            >
              <Stack space={2}>
                <SelectFilter
                  name="regionCode"
                  label={companiesText.region}
                  placeholder={companiesText.regionPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={regionOptions}
                  selected={filters.regionCode}
                  onChange={(codes) => onFiltersChange('regionCode', codes)}
                />
                <SelectFilter
                  name="postcode"
                  label={companiesText.postcode}
                  placeholder={companiesText.postcodePlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={postcodeOptions}
                  selected={filters.postcode}
                  onChange={(codes) => onFiltersChange('postcode', codes)}
                />
              </Stack>
            </AccordionItem>
            <AccordionItem
              id="isatCategoryCode"
              label={companiesText.isatCategory}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(filters.isatCategoryCode)}
              iconVariant="small"
            >
              <IsatCategoryFilter
                selected={filters.isatCategoryCode}
                onChange={(codes) => onFiltersChange('isatCategoryCode', codes)}
              />
            </AccordionItem>
          </Accordion>
        </Box>
      </Filter>
    </>
  )
}
