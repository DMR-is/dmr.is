'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
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
  OBLIGATION_FILTER_OPTIONS,
  SECTOR_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
} from './companyStatus'
import { IsatCategoryFilter } from './IsatCategoryFilter'
import { IsatSectionFilter } from './IsatSectionFilter'

export type FilterOption = { value: string; label: string }

export type CompanyFilters = {
  employees: string[]
  /** Reporting obligation (`CompanyObligationFilterEnum`); selections AND. */
  obligation: string[]
  /**
   * Compliance — "Vantar …" (`CompanyReportStatusEnum`) and "Gild …"
   * (`CompanyValidReportFilterEnum`) in one control; see `splitStatusFilter`.
   */
  status: string[]
  expires: string[]
  /** Checkbox toggles from `FLAG_FILTER_OPTIONS` (daily fines). */
  flags: string[]
  regionCode: string[]
  postcode: string[]
  isatCategoryCode: string[]
  isatSection: string[]
  sector: string[]
  /** Checkbox toggles from `VISIBILITY_FILTER_OPTIONS` (óvirk, í vari). */
  visibility: string[]
}

type Props = {
  query: string
  onQueryChange: (val: string) => void
  /**
   * Extra accordion cards, rendered after the three the register always shows.
   *
   * A slot rather than more props: the data-export screen adds a whole group of
   * report criteria that the register has no use for, and threading each of
   * them through here would make this component's signature the union of every
   * screen that uses it.
   */
  children?: React.ReactNode
  filters: CompanyFilters
  onFiltersChange: (key: keyof CompanyFilters, val: string[]) => void
  onReset: () => void
  regionOptions: FilterOption[]
  postcodeOptions: FilterOption[]
}

export const CompanyFilter = ({
  query,
  onQueryChange,
  children,
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

  // One checkbox per option, toggling its value in the array-valued key.
  const checkboxes = (
    key: 'flags' | 'visibility',
    options: { value: string; label: string }[],
  ) =>
    options.map(({ value, label }) => (
      <Checkbox
        key={value}
        id={`${key}-${value}`}
        name={`${key}-${value}`}
        label={label}
        checked={filters[key].includes(value)}
        onChange={(e) =>
          onFiltersChange(
            key,
            e.target.checked
              ? [...filters[key], value]
              : filters[key].filter((v) => v !== value),
          )
        }
      />
    ))

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
              labelColor={labelColor(
                filters.employees,
                filters.obligation,
                filters.sector,
                filters.isatSection,
                filters.isatCategoryCode,
                filters.visibility,
              )}
              iconVariant="small"
            >
              <Stack space={2}>
                <MultiSelectFilter
                  name="employees"
                  label={companiesText.avgEmployeeCount}
                  placeholder={companiesText.avgEmployeeCountPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={EMPLOYEE_RANGES}
                  selected={filters.employees}
                  // Multi since the API took a list: the register's own
                  // default question is "everyone the law reaches", which is
                  // 25–49 AND 50+ and was unaskable as a single value.
                  onChange={(val) => onFiltersChange('employees', val)}
                />
                <MultiSelectFilter
                  name="obligation"
                  label={companiesText.obligation}
                  placeholder={companiesText.obligationPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={OBLIGATION_FILTER_OPTIONS}
                  selected={filters.obligation}
                  onChange={(val) => onFiltersChange('obligation', val)}
                />
                <MultiSelectFilter
                  name="sector"
                  label={companiesText.sector}
                  placeholder={companiesText.sectorPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={SECTOR_FILTER_OPTIONS}
                  selected={filters.sector}
                  onChange={(val) => onFiltersChange('sector', val)}
                />
                <IsatSectionFilter
                  label={companiesText.isatSection}
                  selected={filters.isatSection}
                  onChange={(codes) => onFiltersChange('isatSection', codes)}
                />
                <IsatCategoryFilter
                  label={companiesText.isatCategory}
                  selected={filters.isatCategoryCode}
                  onChange={(codes) =>
                    onFiltersChange('isatCategoryCode', codes)
                  }
                />
                {checkboxes('visibility', VISIBILITY_FILTER_OPTIONS)}
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
                {checkboxes('flags', FLAG_FILTER_OPTIONS)}
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
            {children}
          </Accordion>
        </Box>
      </Filter>
    </>
  )
}
