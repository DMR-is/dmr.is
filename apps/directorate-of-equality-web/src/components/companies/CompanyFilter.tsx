'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { MultiSelectFilter } from '@dmr.is/ui/components/island-is/MultiSelectFilter'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../hooks/useIsMobile'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, sharedText } from '../../lib/text'
import { EMPLOYEE_RANGES } from '../../lib/utils'
import {
  EXPIRES_FILTER_OPTIONS,
  FLAG_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './companyStatus'
import { IsatCategoryFilter } from './IsatCategoryFilter'
import { SelectFilter } from './SelectFilter'

export type FilterOption = { value: string; label: string }

export type CompanyFilters = {
  employees: string[]
  status: string[]
  expires: string[]
  flags: string[]
  regionCode: string[]
  postcode: string[]
  isatCategoryCode: string[]
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

  // Blue label once any filter in the card is active.
  const labelColor = (...selections: string[][]) =>
    selections.some((s) => s.length > 0) ? 'blue400' : 'currentColor'

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
            <AccordionItem
              id="company"
              label={companiesText.cardCompany}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(filters.employees, filters.isatCategoryCode)}
              iconVariant="small"
            >
              <Stack space={2}>
                <SelectFilter
                  name="employees"
                  label={companiesText.avgEmployeeCount}
                  placeholder={companiesText.avgEmployeeCountPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={EMPLOYEE_RANGES}
                  selected={filters.employees}
                  isMulti={false}
                  onChange={(val) => onFiltersChange('employees', val)}
                />
                <IsatCategoryFilter
                  label={companiesText.isatCategory}
                  selected={filters.isatCategoryCode}
                  onChange={(codes) =>
                    onFiltersChange('isatCategoryCode', codes)
                  }
                />
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="status"
              label={companiesText.cardStatus}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(
                filters.status,
                filters.expires,
                filters.flags,
              )}
              iconVariant="small"
            >
              <Stack space={2}>
                <MultiSelectFilter
                  name="status"
                  label={sharedText.statusLabel}
                  placeholder={companiesText.statusPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={STATUS_FILTER_OPTIONS}
                  selected={filters.status}
                  onChange={(val) => onFiltersChange('status', val)}
                />
                <MultiSelectFilter
                  name="expires"
                  label={companiesText.validPeriod}
                  placeholder={companiesText.validPeriodPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={EXPIRES_FILTER_OPTIONS}
                  selected={filters.expires}
                  onChange={(val) => onFiltersChange('expires', val)}
                />
                <MultiSelectFilter
                  name="flags"
                  label={companiesText.flags}
                  placeholder={companiesText.flagsPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={FLAG_FILTER_OPTIONS}
                  selected={filters.flags}
                  onChange={(val) => onFiltersChange('flags', val)}
                />
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="location"
              label={companiesText.cardLocation}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(filters.regionCode, filters.postcode)}
              iconVariant="small"
            >
              <Stack space={2}>
                <MultiSelectFilter
                  name="regionCode"
                  label={companiesText.region}
                  placeholder={companiesText.regionPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={regionOptions}
                  selected={filters.regionCode}
                  onChange={(codes) => onFiltersChange('regionCode', codes)}
                />
                <MultiSelectFilter
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
          </Accordion>
        </Box>
      </Filter>
    </>
  )
}
