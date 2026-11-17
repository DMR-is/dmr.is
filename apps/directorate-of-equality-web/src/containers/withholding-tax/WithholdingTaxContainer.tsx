'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { WithholdingTaxExpandedRow } from '../../components/withholding-tax/WithholdingTaxExpandedRow'
import {
  EMPTY_WITHHOLDING_TAX_FILTERS,
  type FilterOption,
  WithholdingTaxFilter,
  type WithholdingTaxFilters,
} from '../../components/withholding-tax/WithholdingTaxFilter'
import { type WithholdingTaxJobCountDto } from '../../gen/fetch/types.gen'
import { useIsMobile } from '../../hooks/useIsMobile'
import { withholdingTaxText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useMutation } from '@tanstack/react-query'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'

const t = withholdingTaxText

const PAGE_SIZE = 50

const yearOptions = (lastYear: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const year = lastYear - i
    return { label: String(year), value: year }
  })

const isatLabel = (c: WithholdingTaxJobCountDto) =>
  [c.isatCode, c.isatText].filter(Boolean).join(' ')

// A few columns only; every value is in the expanded row.
const columns: ColumnDef<WithholdingTaxJobCountDto>[] = [
  {
    accessorKey: 'name',
    header: t.columns.name,
    cell: ({ row }) => row.original.name ?? '',
  },
  {
    accessorKey: 'nationalId',
    header: t.columns.nationalId,
    cell: ({ row }) => formatNationalId(row.original.nationalId),
  },
  {
    accessorKey: 'city',
    header: t.columns.city,
    cell: ({ row }) => row.original.city ?? '',
  },
  { accessorKey: 'jobCountBand', header: t.columns.band },
]

/** Distinct non-empty values of one field, as sorted filter options. */
const optionsOf = (
  companies: WithholdingTaxJobCountDto[],
  value: (c: WithholdingTaxJobCountDto) => string | null | undefined,
  label: (c: WithholdingTaxJobCountDto) => string = (c) => value(c) ?? '',
): FilterOption[] => {
  const seen = new Map<string, string>()
  for (const c of companies) {
    const v = value(c)
    if (v && !seen.has(v)) seen.set(v, label(c))
  }
  return [...seen.entries()]
    .map(([v, l]) => ({ value: v, label: l }))
    .sort((a, b) => a.label.localeCompare(b.label, 'is'))
}

type SortKey = 'name' | 'nationalId' | 'city' | 'jobCountBand'

/**
 * Sorts the whole filtered list, so a sorted column is the year's order and
 * not just the page's: `Table` runs controlled and only reports the state.
 */
const sortCompanies = (
  companies: WithholdingTaxJobCountDto[],
  sorting: SortingState,
): WithholdingTaxJobCountDto[] => {
  const [sort] = sorting
  if (!sort) return companies
  const key = sort.id as SortKey
  const dir = sort.desc ? -1 : 1
  return [...companies].sort(
    (a, b) => dir * (a[key] ?? '').localeCompare(b[key] ?? '', 'is'),
  )
}

const matches = (selected: string[], value: string | null | undefined) =>
  selected.length === 0 || (value != null && selected.includes(value))

/**
 * Read-only view of Skatturinn's job-count feed for one income year, laid out
 * like Vinnslusvæði. Writes nothing: it exists to see what the feed returns
 * before the register uses it.
 */
export const WithholdingTaxContainer = () => {
  const trpc = useTRPC()
  const { isMobile } = useIsMobile()
  // Per render, not module load: a server that runs past 1 January must
  // offer the new year.
  const lastYear = new Date().getFullYear() - 1
  const years = useMemo(() => yearOptions(lastYear), [lastYear])
  const [year, setYear] = useState(lastYear)
  // Set by the fetch button, so changing the select alone does not call
  // Skatturinn: every call downloads the whole 25+ list for the year.
  const [requestedYear, setRequestedYear] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<WithholdingTaxFilters>(
    EMPTY_WITHHOLDING_TAX_FILTERS,
  )

  const { data, isFetching, isError, refetch } = useQuery({
    ...trpc.withholdingTax.getJobCounts.queryOptions({
      incomeYear: requestedYear ?? lastYear,
    }),
    enabled: requestedYear !== null,
    // The only cache there is: kept for this page session so filtering and
    // paging never call Skatturinn. Nothing is cached server-side yet — see
    // `WithholdingTaxService.getJobCounts`.
    staleTime: Infinity,
    retry: false,
  })

  const check = useMutation({
    ...trpc.withholdingTax.check.mutationOptions(),
    onSuccess: (result) => {
      if (result.ok) toast.success(t.checkOk)
      else toast.error(t.checkFailed(result.reason), { autoClose: 8000 })
    },
    onError: () => toast.error(t.checkFailed(null)),
  })

  const allCompanies = useMemo(() => data?.companies ?? [], [data])

  const filterOptions = useMemo(
    () => ({
      isat: optionsOf(allCompanies, (c) => c.isatCode, isatLabel),
      city: optionsOf(allCompanies, (c) => c.city),
      postcode: optionsOf(allCompanies, (c) => c.postcode),
    }),
    [allCompanies],
  )

  const companies = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Only a query of digits and separators is a kennitala: "66°Norður" must
    // not match every kennitala containing 66.
    const qDigits = /^[\d\s-]+$/.test(q) ? q.replace(/\D/g, '') : ''
    return allCompanies.filter(
      (c) =>
        (!q ||
          (c.name ?? '').toLowerCase().includes(q) ||
          (qDigits.length > 0 && c.nationalId.includes(qDigits))) &&
        matches(filters.band, c.jobCountBand) &&
        matches(filters.isat, c.isatCode) &&
        matches(filters.city, c.city) &&
        matches(filters.postcode, c.postcode),
    )
  }, [allCompanies, query, filters])

  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE))
  const sortedCompanies = useMemo(
    () => sortCompanies(companies, sorting),
    [companies, sorting],
  )
  // Memoised: `Table` collapses expanded rows whenever `data` changes identity.
  const pageRows = useMemo(
    () => sortedCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedCompanies, page],
  )

  const onQueryChange = (val: string) => {
    setQuery(val)
    setPage(1)
  }
  const onFiltersChange = (key: keyof WithholdingTaxFilters, val: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
    setPage(1)
  }
  const onSortingChange = (next: SortingState) => {
    setSorting(next)
    setPage(1)
  }
  const onReset = () => {
    setQuery('')
    setFilters(EMPTY_WITHHOLDING_TAX_FILTERS)
    setPage(1)
  }

  const onFetch = () => {
    setPage(1)
    if (requestedYear === year) refetch()
    else {
      // The filter options are built from the year's rows.
      onReset()
      setRequestedYear(year)
    }
  }

  const fetchControls = (
    <Stack space={2}>
      <Select
        name="withholding-tax-income-year"
        size="xs"
        label={t.incomeYearLabel}
        options={years}
        value={years.find((o) => o.value === year) ?? null}
        onChange={(opt) => {
          if (opt) setYear(opt.value)
        }}
      />
      <Button fluid size="small" onClick={onFetch} loading={isFetching}>
        {t.fetch}
      </Button>
      <Button
        fluid
        size="small"
        variant="ghost"
        onClick={() => check.mutate()}
        loading={check.isPending}
      >
        {t.check}
      </Button>
    </Stack>
  )

  return (
    <GridContainer>
      <Box paddingTop={[0, 0, 4]}>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '12/12', '4/12', '3/12']}>
            <Stack space={3}>
              <WithholdingTaxFilter
                disabled={!data}
                query={query}
                onQueryChange={onQueryChange}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onReset={onReset}
                options={filterOptions}
              />
              {!isMobile && fetchControls}
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '12/12', '8/12', '9/12']}>
            <Box marginLeft={[0, 0, 0, 2]}>
              <Stack space={[1, 2]}>
                {isMobile && <Box marginTop={2}>{fetchControls}</Box>}

                {isError && !isFetching && (
                  <AlertMessage type="error" title={t.fetchError} />
                )}

                {data && data.skipped.length > 0 && (
                  <AlertMessage
                    type="warning"
                    title={`${t.skippedHeading} (${data.skipped.length})`}
                    message={
                      <Stack space={1}>
                        {data.skipped.map((s) => (
                          <Text key={s.index} variant="small">
                            {t.skippedRow(s.index)}: {s.issues.join(', ')}
                          </Text>
                        ))}
                      </Stack>
                    }
                  />
                )}

                <Inline space={1} alignY="center">
                  <Text fontWeight="semiBold" marginTop={isMobile ? 2 : 0}>
                    {companies.length}
                  </Text>
                  <Text marginTop={isMobile ? 2 : 0}>
                    {data
                      ? t.resultsText(data.incomeYear, allCompanies.length)
                      : t.resultsIdle}
                  </Text>
                </Inline>

                <Box marginTop={2}>
                  <Table
                    columns={columns}
                    data={pageRows}
                    loading={isFetching}
                    getRowExpanded={(row) => (
                      <WithholdingTaxExpandedRow row={row} />
                    )}
                    sorting={sorting}
                    onSortingChange={onSortingChange}
                    noDataMessage={requestedYear === null ? t.idle : t.noData}
                    paging={{
                      page,
                      pageSize: PAGE_SIZE,
                      totalItems: companies.length,
                      totalPages,
                    }}
                    onPageChange={setPage}
                    showPageSizeSelect={false}
                  />
                </Box>

                {data && <Text variant="small">{t.absentNote}</Text>}
              </Stack>
            </Box>
          </GridColumn>
        </GridRow>
      </Box>
    </GridContainer>
  )
}
