'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { MultiSelectFilter } from '@dmr.is/ui/components/island-is/MultiSelectFilter'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../hooks/useIsMobile'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, dataExportText, sharedText } from '../../lib/text'
import { type FilterOption } from '../companies/CompanyFilter'
import { SECTOR_FILTER_OPTIONS } from '../companies/companyStatus'
import { IsatCategoryFilter } from '../companies/IsatCategoryFilter'
import { IsatSectionFilter } from '../companies/IsatSectionFilter'
import { SelectFilter } from '../companies/SelectFilter'
import {
  ADMIN_GENDER_OPTIONS,
  COMMUNICATION_STATUS_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  GAP_BOUND_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from './reportExportOptions'

/**
 * Filter panel for the Skýrslur dataset.
 *
 * A sibling of `CompanyFilter` rather than a reuse of it: the two share their
 * company card almost exactly, but a report also has a type, a status, a
 * reviewer-facing communication state and four independent date ranges, and
 * the shared half is three controls. Folding both into one component would
 * mean a prop for every control on both screens.
 *
 * The company-side controls it DOES share are imported as they are
 * (`SelectFilter`, the ÍSAT pickers, `SECTOR_FILTER_OPTIONS`), so
 * "Sveitarfélög" means the same thing on both datasets.
 */
export type ReportFilters = {
  type: string[]
  status: string[]
  communicationStatus: string[]
  equalitySource: string[]
  companyAdminGender: string[]
  employees: string[]
  sector: string[]
  isatSection: string[]
  isatCategoryCode: string[]
  regionCode: string[]
  postcode: string[]
}

export const EMPTY_REPORT_FILTERS: ReportFilters = {
  type: [],
  status: [],
  communicationStatus: [],
  equalitySource: [],
  companyAdminGender: [],
  employees: [],
  sector: [],
  isatSection: [],
  isatCategoryCode: [],
  regionCode: [],
  postcode: [],
}

/**
 * The date ranges, kept apart from the multi-selects because they are pairs
 * rather than lists and the panel has four of them.
 */
export type ReportDateRanges = {
  createdFrom?: Date
  createdTo?: Date
  approvedFrom?: Date
  approvedTo?: Date
  validUntilFrom?: Date
  validUntilTo?: Date
  salaryDataPeriodFrom?: Date
  salaryDataPeriodTo?: Date
}

export type ReportDateKey = keyof ReportDateRanges

/**
 * The two pay-gap ranges, as strings because they come straight off a select.
 * Parsed to numbers where they are turned into query params.
 */
export type ReportGapBounds = {
  rawGapPercentFrom?: string
  rawGapPercentTo?: string
  oskyrtPercentFrom?: string
  oskyrtPercentTo?: string
}

export type ReportGapKey = keyof ReportGapBounds

export const EMPTY_GAP_BOUNDS: ReportGapBounds = {}

type Props = {
  query: string
  onQueryChange: (value: string) => void
  filters: ReportFilters
  onFiltersChange: (key: keyof ReportFilters, values: string[]) => void
  dates: ReportDateRanges
  onDateChange: (key: ReportDateKey, value: Date | undefined) => void
  gaps: ReportGapBounds
  onGapChange: (key: ReportGapKey, value: string | undefined) => void
  onReset: () => void
  regionOptions: FilterOption[]
  postcodeOptions: FilterOption[]
}

export const ReportExportFilter = ({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  dates,
  onDateChange,
  gaps,
  onGapChange,
  onReset,
  regionOptions,
  postcodeOptions,
}: Props) => {
  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  const labelColor = (...selections: Array<string[] | boolean>) =>
    selections.some((s) => (Array.isArray(s) ? s.length > 0 : s))
      ? 'blue400'
      : 'currentColor'

  const range = (
    label: string,
    fromKey: ReportDateKey,
    toKey: ReportDateKey,
  ) => (
    <Stack space={1}>
      <Text variant="eyebrow">{label}</Text>
      <DatePicker
        name={fromKey}
        label={dataExportText.dateFrom}
        placeholderText={dataExportText.datePlaceholder}
        size="sm"
        locale="is"
        selected={dates[fromKey]}
        handleChange={(date) => onDateChange(fromKey, date ?? undefined)}
        backgroundColor="white"
        required={false}
      />
      <DatePicker
        name={toKey}
        label={dataExportText.dateTo}
        placeholderText={dataExportText.datePlaceholder}
        size="sm"
        locale="is"
        selected={dates[toKey]}
        // The lower bound is the floor: a "to" before the "from" describes an
        // empty range, and the picker refusing it is clearer than an empty
        // result table that looks like a data problem.
        minDate={dates[fromKey]}
        handleChange={(date) => onDateChange(toKey, date ?? undefined)}
        backgroundColor="white"
        required={false}
      />
    </Stack>
  )

  /**
   * One gap's bounds. Both selects share the same 0,5-step option list; the
   * upper one is floored at the lower so an impossible range cannot be built.
   */
  const gapRange = (
    label: string,
    fromKey: ReportGapKey,
    toKey: ReportGapKey,
  ) => {
    const from = gaps[fromKey]
    const upperOptions = from
      ? GAP_BOUND_OPTIONS.filter(
          (option) => Number(option.value) >= Number(from),
        )
      : GAP_BOUND_OPTIONS

    return (
      <Stack space={1}>
        <Text variant="eyebrow">{label}</Text>
        <SelectFilter
          name={fromKey}
          label={dataExportText.gapFrom}
          placeholder={dataExportText.gapPlaceholder}
          noOptionsMessage={companiesText.filterNoResults}
          options={GAP_BOUND_OPTIONS}
          selected={from ? [from] : []}
          isMulti={false}
          onChange={(val) => onGapChange(fromKey, val[0])}
        />
        <SelectFilter
          name={toKey}
          label={dataExportText.gapTo}
          placeholder={dataExportText.gapNoUpperBound}
          noOptionsMessage={companiesText.filterNoResults}
          options={upperOptions}
          selected={gaps[toKey] ? [gaps[toKey] as string] : []}
          isMulti={false}
          onChange={(val) => onGapChange(toKey, val[0])}
        />
      </Stack>
    )
  }

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
            name="reportQuery"
            placeholder={dataExportText.reportSearchPlaceholder}
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
              id="report"
              label={dataExportText.cardReport}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(
                filters.type,
                filters.status,
                filters.communicationStatus,
                filters.equalitySource,
              )}
              iconVariant="small"
            >
              <Stack space={2}>
                <MultiSelectFilter
                  name="type"
                  label={dataExportText.typeLabel}
                  placeholder={dataExportText.typePlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={REPORT_TYPE_OPTIONS}
                  selected={filters.type}
                  onChange={(val) => onFiltersChange('type', val)}
                />
                <MultiSelectFilter
                  name="status"
                  label={dataExportText.statusLabel}
                  placeholder={dataExportText.statusPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={REPORT_STATUS_OPTIONS}
                  selected={filters.status}
                  onChange={(val) => onFiltersChange('status', val)}
                />
                <MultiSelectFilter
                  name="communicationStatus"
                  label={dataExportText.communicationLabel}
                  placeholder={dataExportText.communicationPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={COMMUNICATION_STATUS_OPTIONS}
                  selected={filters.communicationStatus}
                  onChange={(val) => onFiltersChange('communicationStatus', val)}
                />
                <MultiSelectFilter
                  name="equalitySource"
                  label={dataExportText.equalitySourceLabel}
                  placeholder={dataExportText.equalitySourcePlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={EQUALITY_SOURCE_OPTIONS}
                  selected={filters.equalitySource}
                  onChange={(val) => onFiltersChange('equalitySource', val)}
                />
                <MultiSelectFilter
                  name="companyAdminGender"
                  label={dataExportText.adminGenderLabel}
                  placeholder={dataExportText.adminGenderPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  isSearchable={false}
                  options={ADMIN_GENDER_OPTIONS}
                  selected={filters.companyAdminGender}
                  onChange={(val) =>
                    onFiltersChange('companyAdminGender', val)
                  }
                />
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="reportCompany"
              label={companiesText.cardCompany}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(
                filters.employees,
                filters.sector,
                filters.isatSection,
                filters.isatCategoryCode,
              )}
              iconVariant="small"
            >
              <Stack space={2}>
                <SelectFilter
                  name="reportEmployees"
                  label={companiesText.avgEmployeeCount}
                  placeholder={companiesText.avgEmployeeCountPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={EMPLOYEE_RANGE_OPTIONS}
                  selected={filters.employees}
                  onChange={(val) => onFiltersChange('employees', val)}
                />
                <MultiSelectFilter
                  name="reportSector"
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
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="reportLocation"
              label={companiesText.cardLocation}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(filters.regionCode, filters.postcode)}
              iconVariant="small"
            >
              <Stack space={2}>
                <SelectFilter
                  name="reportRegion"
                  label={companiesText.region}
                  placeholder={companiesText.regionPlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={regionOptions}
                  selected={filters.regionCode}
                  onChange={(val) => onFiltersChange('regionCode', val)}
                />
                <SelectFilter
                  name="reportPostcode"
                  label={companiesText.postcode}
                  placeholder={companiesText.postcodePlaceholder}
                  noOptionsMessage={companiesText.filterNoResults}
                  options={postcodeOptions}
                  selected={filters.postcode}
                  onChange={(val) => onFiltersChange('postcode', val)}
                />
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="reportGap"
              label={dataExportText.cardGap}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(
                Object.values(gaps).some((value) => value !== undefined),
              )}
              iconVariant="small"
            >
              <Stack space={3}>
                {gapRange(
                  dataExportText.rawGapRange,
                  'rawGapPercentFrom',
                  'rawGapPercentTo',
                )}
                {gapRange(
                  dataExportText.oskyrtGapRange,
                  'oskyrtPercentFrom',
                  'oskyrtPercentTo',
                )}
              </Stack>
            </AccordionItem>

            <AccordionItem
              id="reportDates"
              label={dataExportText.cardDates}
              labelUse="h5"
              labelVariant="h5"
              labelColor={labelColor(
                Object.values(dates).some((value) => value !== undefined),
              )}
              iconVariant="small"
            >
              <Stack space={3}>
                {range(dataExportText.createdRange, 'createdFrom', 'createdTo')}
                {range(
                  dataExportText.approvedRange,
                  'approvedFrom',
                  'approvedTo',
                )}
                {range(
                  dataExportText.validUntilRange,
                  'validUntilFrom',
                  'validUntilTo',
                )}
                {range(
                  dataExportText.salaryPeriodRange,
                  'salaryDataPeriodFrom',
                  'salaryDataPeriodTo',
                )}
              </Stack>
            </AccordionItem>
          </Accordion>
        </Box>
      </Filter>
    </>
  )
}

/**
 * Employee-count buckets as filter options.
 *
 * ⚠️ NOT `EMPLOYEE_RANGES` from `lib/utils`, which the register uses: that list
 * is built for a single-select and this filter is a multi-select, because the
 * report query takes a list. "25–49 and 50+" — everyone the law reaches — is
 * the query this dataset exists to answer.
 */
const EMPLOYEE_RANGE_OPTIONS: FilterOption[] = [
  { value: 'SMALL', label: '0–24' },
  { value: 'MEDIUM', label: '25–49' },
  { value: 'LARGE', label: '50+' },
  { value: 'UNKNOWN', label: 'Óþekkt' },
]
