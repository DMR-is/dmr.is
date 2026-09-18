'use client'

import { useMemo } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { companiesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { EMPLOYEE_RANGES } from '../../lib/utils'
import { type CompanyFilters, type FilterOption } from './CompanyFilter'
import {
  COMPANY_STATUS_FILTER_OPTIONS,
  EXPIRES_FILTER_OPTIONS,
  FLAG_FILTER_OPTIONS,
  SECTOR_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
} from './companyStatus'

/**
 * One removable chip. Search and the legacy quarantine constraint live
 * outside `CompanyFilters`, but still affect the results and must be visible.
 */
type Chip = {
  key: keyof CompanyFilters | 'q' | 'quarantined'
  value: string
  label: string
}

type Props = {
  query: string
  quarantined: boolean | null
  filters: CompanyFilters
  regionOptions: FilterOption[]
  postcodeOptions: FilterOption[]
  onFiltersChange: (key: keyof CompanyFilters, val: string[]) => void
  onQueryClear: () => void
  onQuarantinedClear: () => void
  onReset: () => void
}

const labelFor = (options: FilterOption[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value

/**
 * The active filters, restated above the results as removable chips.
 *
 * The filter panel already turns a card's heading blue when something inside it
 * is set, but that tells an admin only that *some* filter in *some* collapsed
 * accordion is on — and the register arrives pre-filtered often enough (three
 * hides on by default, plus the links in from the front page) that "why am I
 * seeing 212 companies" is the normal question rather than an unusual one. The
 * count above the table answers "how many"; this answers "why".
 *
 * ⚠️ Every axis the panel can set is represented, including the three reveals
 * under "Engin skilaskylda". A reveal widens the result set rather than
 * narrowing it, but it is still an answer the admin gave and still explains the
 * rows on screen — leaving them out would make "Sýna óvirk" the one filter with
 * no visible trace.
 */
export const CompanyActiveFilters = ({
  query,
  quarantined,
  filters,
  regionOptions,
  postcodeOptions,
  onFiltersChange,
  onQueryClear,
  onQuarantinedClear,
  onReset,
}: Props) => {
  const trpc = useTRPC()

  // Both are reference data the filter panel has already asked for with the
  // same key and the same hour-long `staleTime`, so these resolve from cache
  // rather than costing a second round trip. Labels are what the chips need and
  // the selection only carries codes.
  const { data: isatSections } = useQuery(
    trpc.company.isatSections.queryOptions(undefined, {
      staleTime: 60 * 60_000,
    }),
  )

  const { data: isatCategories } = useQuery(
    trpc.company.isatCategories.queryOptions(undefined, {
      staleTime: 60 * 60_000,
    }),
  )

  const isatSectionOptions = useMemo(
    () =>
      (isatSections ?? []).map((section) => ({
        value: section.code,
        label: `${section.code} – ${section.description}`,
      })),
    [isatSections],
  )

  const isatCategoryOptions = useMemo(
    () =>
      (isatCategories ?? []).map((category) => ({
        value: category.code,
        label: `${category.codeDotted} – ${category.description}`,
      })),
    [isatCategories],
  )

  // Ordered to follow the panel above it — company, then status, then location
  // — so a chip and the control that set it are found in the same sweep.
  const chips: Chip[] = [
    ...(query.trim()
      ? [
          {
            key: 'q' as const,
            value: query,
            label: `${companiesText.activeFilterQuery}: ${query}`,
          },
        ]
      : []),
    // Preserve old bookmarks' narrower result set until explicitly cleared.
    ...(quarantined !== null
      ? [
          {
            key: 'quarantined' as const,
            value: String(quarantined),
            label: quarantined
              ? companiesText.onlyQuarantined
              : companiesText.excludeQuarantined,
          },
        ]
      : []),
    ...filters.employees.map((value) => ({
      key: 'employees' as const,
      value,
      label: labelFor(EMPLOYEE_RANGES, value),
    })),
    ...filters.registerStatus.map((value) => ({
      key: 'registerStatus' as const,
      value,
      label: labelFor(COMPANY_STATUS_FILTER_OPTIONS, value),
    })),
    ...filters.sector.map((value) => ({
      key: 'sector' as const,
      value,
      label: labelFor(SECTOR_FILTER_OPTIONS, value),
    })),
    ...filters.isatSection.map((value) => ({
      key: 'isatSection' as const,
      value,
      label: labelFor(isatSectionOptions, value),
    })),
    ...filters.isatCategoryCode.map((value) => ({
      key: 'isatCategoryCode' as const,
      value,
      label: labelFor(isatCategoryOptions, value),
    })),
    ...filters.visibility.map((value) => ({
      key: 'visibility' as const,
      value,
      label: labelFor(VISIBILITY_FILTER_OPTIONS, value),
    })),
    ...filters.status.map((value) => ({
      key: 'status' as const,
      value,
      label: labelFor(STATUS_FILTER_OPTIONS, value),
    })),
    ...filters.expires.map((value) => ({
      key: 'expires' as const,
      value,
      label: labelFor(EXPIRES_FILTER_OPTIONS, value),
    })),
    ...filters.flags.map((value) => ({
      key: 'flags' as const,
      value,
      label: labelFor(FLAG_FILTER_OPTIONS, value),
    })),
    ...filters.regionCode.map((value) => ({
      key: 'regionCode' as const,
      value,
      label: labelFor(regionOptions, value),
    })),
    ...filters.postcode.map((value) => ({
      key: 'postcode' as const,
      value,
      label: labelFor(postcodeOptions, value),
    })),
  ]

  if (!chips.length) return null

  const remove = ({ key, value }: Chip) => {
    if (key === 'q') {
      onQueryClear()
      return
    }
    if (key === 'quarantined') {
      onQuarantinedClear()
      return
    }
    // Routed through the same handler the panel uses rather than setting the
    // URL directly: `regionCode` also clears the postcode selection there, and
    // a chip that skipped that would leave a postcode contradicting its region.
    onFiltersChange(
      key,
      filters[key].filter((selected) => selected !== value),
    )
  }

  return (
    <Box marginLeft={[0, 0, 0, 2]} marginBottom={2}>
      <Inline space={1} alignY="center" flexWrap="wrap">
        <Text variant="small" fontWeight="semiBold">
          {companiesText.activeFilters}:
        </Text>
        {chips.map((chip) => (
          <Tag
            key={`${chip.key}-${chip.value}`}
            variant="blue"
            outlined
            onClick={() => remove(chip)}
          >
            <Box
              component="span"
              display="inlineFlex"
              alignItems="center"
              columnGap={1}
            >
              {chip.label}
              <Icon icon="close" size="small" />
            </Box>
          </Tag>
        ))}
        <Button variant="text" size="small" icon="reload" onClick={onReset}>
          {companiesText.clearAllFilters}
        </Button>
      </Inline>
    </Box>
  )
}
