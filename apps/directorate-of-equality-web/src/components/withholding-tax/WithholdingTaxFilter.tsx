'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { MultiSelectFilter } from '@dmr.is/ui/components/island-is/MultiSelectFilter'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../hooks/useIsMobile'
import { useIsTablet } from '../../hooks/useIsTablet'
import { sharedText, withholdingTaxText } from '../../lib/text'
import * as styles from './WithholdingTaxFilter.css'

const t = withholdingTaxText.filter

export type FilterOption = { value: string; label: string }

export type WithholdingTaxFilters = {
  band: string[]
  isat: string[]
  city: string[]
  postcode: string[]
}

export const EMPTY_WITHHOLDING_TAX_FILTERS: WithholdingTaxFilters = {
  band: [],
  isat: [],
  city: [],
  postcode: [],
}

/** Skatturinn only reports these two; fixed so the group shows before a fetch. */
const BAND_OPTIONS: FilterOption[] = [
  { value: '25-49', label: '25–49' },
  { value: '50+', label: '50+' },
]

type SelectKey = Exclude<keyof WithholdingTaxFilters, 'band'>

type Props = {
  /** True until a year has been fetched: there is nothing to filter yet. */
  disabled: boolean
  query: string
  onQueryChange: (val: string) => void
  filters: WithholdingTaxFilters
  onFiltersChange: (key: keyof WithholdingTaxFilters, val: string[]) => void
  onReset: () => void
  options: Record<SelectKey, FilterOption[]>
}

/**
 * Client-side filters over one fetched income year, laid out like the
 * Vinnslusvæði filter. Ársverk is a checkbox group; ÍSAT, staður and póstnúmer
 * have too many values for checkboxes and are searchable selects. The options
 * come from the rows themselves, so nothing here calls Skatturinn again.
 */
export const WithholdingTaxFilter = ({
  disabled,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onReset,
  options,
}: Props) => {
  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  const select = (key: SelectKey, label: string, placeholder: string) => (
    <MultiSelectFilter
      name={`withholding-tax-${key}`}
      label={label}
      placeholder={placeholder}
      noOptionsMessage={t.noResults}
      isDisabled={disabled}
      options={options[key]}
      selected={filters[key]}
      onChange={(val) => onFiltersChange(key, val)}
    />
  )

  return (
    <Box>
      {!isMobile && (
        <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
          {t.heading}
        </Text>
      )}
      <fieldset
        disabled={disabled}
        aria-disabled={disabled}
        className={styles.fieldset}
      >
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
            <Box marginTop={3}>
              <FilterInput
                name="withholding-tax-query"
                placeholder={t.queryPlaceholder}
                value={query}
                onChange={onQueryChange}
                backgroundColor="white"
              />
            </Box>
          }
        >
          <FilterMultiChoice
            labelClear={sharedText.filter.labelClear}
            onChange={({ categoryId, selected }) => {
              if (categoryId === 'band') onFiltersChange('band', selected)
            }}
            onClear={(categoryId) => {
              if (categoryId === 'band') onFiltersChange('band', [])
            }}
            singleExpand={false}
            categories={[
              {
                id: 'band',
                label: t.band,
                selected: filters.band,
                filters: BAND_OPTIONS,
              },
            ]}
          />
          <Box
            className={styles.selectSection}
            paddingX={3}
            paddingBottom={3}
            background="white"
          >
            <Box borderTopWidth="standard" borderColor="blue200" width="full" />
            <Box paddingTop={3}>
              <Stack space={2}>
                {select('isat', t.isat, t.isatPlaceholder)}
                {select('city', t.city, t.cityPlaceholder)}
                {select('postcode', t.postcode, t.postcodePlaceholder)}
              </Stack>
            </Box>
          </Box>
        </Filter>
      </fieldset>
    </Box>
  )
}
