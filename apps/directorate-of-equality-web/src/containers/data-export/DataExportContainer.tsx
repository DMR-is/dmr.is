'use client'

import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  CompanyFilter,
  type CompanyFilters,
} from '../../components/companies/CompanyFilter'
import { CompanyTable } from '../../components/companies/CompanyTable'
import {
  EMPTY_REPORT_FILTERS,
  type ReportDateKey,
  type ReportDateRanges,
  ReportExportFilter,
  type ReportFilters,
} from '../../components/data-export/ReportExportFilter'
import { ReportExportTable } from '../../components/data-export/ReportExportTable'
import {
  CompanyExpiryFilterEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../gen/fetch'
import { useIsTablet } from '../../hooks/useIsTablet'
import { dataExportText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { buildFilterSummary, buildReportFilterSummary } from './filterSummary'

const DATASETS = ['companies', 'reports'] as const
type Dataset = (typeof DATASETS)[number]

const PAGE_SIZE = 25

const EMPTY_FILTERS: CompanyFilters = {
  employees: [],
  status: [],
  registerStatus: [],
  expires: [],
  flags: [],
  regionCode: [],
  postcode: [],
  isatCategoryCode: [],
  isatSection: [],
  sector: [],
  visibility: [],
}

/**
 * "Keyra út lista" — filter first, then fetch, then export.
 *
 * Unlike the register and the vinnslusvæði, this screen does NOT query as you
 * type. Nothing is fetched until "Sækja lista" is pressed, because the whole
 * point of the page is to narrow a large list before asking for it, and a
 * result table that reshuffles under every keystroke invites exporting the
 * wrong thing.
 *
 * The consequence to keep in mind when editing: what the table shows and what
 * the export contains are BOTH the submitted filter, never the one currently
 * typed into the panel. `submitted` is that snapshot.
 */
export const DataExportContainer = () => {
  const { isTablet } = useIsTablet()
  const trpc = useTRPC()

  const [dataset, setDataset] = useQueryState(
    'gagnasett',
    parseAsStringLiteral(DATASETS).withDefault('companies'),
  )

  const [draft, setDraft] = useState<CompanyFilters>(EMPTY_FILTERS)
  const [reportDraft, setReportDraft] =
    useState<ReportFilters>(EMPTY_REPORT_FILTERS)
  const [reportDates, setReportDates] = useState<ReportDateRanges>({})
  const [query, setQuery] = useState('')

  /**
   * The filter the results and the export are both built from — null until the
   * admin has asked for something.
   *
   * Deliberately a snapshot rather than a read of `draft`: it is what makes the
   * export match the table. Editing the panel after fetching changes neither
   * until "Sækja lista" is pressed again.
   */
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(
    null,
  )
  const [page, setPage] = useState(1)

  // Focus lands here after a fetch: the results appear because a button was
  // pressed, so keyboard and screen-reader users have to be taken to them.
  const resultsRef = useRef<HTMLDivElement>(null)

  const { data: regionsData } = useQuery(
    trpc.location.regions.queryOptions(undefined, { staleTime: 60 * 60_000 }),
  )

  const { data: postcodesData } = useQuery(
    trpc.location.postcodes.queryOptions(
      { regionCode: draft.regionCode.length ? draft.regionCode : undefined },
      { staleTime: 60 * 60_000, placeholderData: (prev) => prev },
    ),
  )

  const regionOptions = useMemo(
    () => (regionsData ?? []).map((r) => ({ value: r.code, label: r.name })),
    [regionsData],
  )

  const postcodeOptions = useMemo(
    () =>
      (postcodesData ?? []).map((p) => ({
        value: p.code,
        label: `${p.code} ${p.place}`,
      })),
    [postcodesData],
  )

  const toServerQuery = useCallback(
    (filters: CompanyFilters, q: string): Record<string, unknown> => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      // Single value until the generated client catches up with the API, which
      // now takes a list — see the note in the commit that widened it.
      ...(filters.employees.length
        ? { employeeCountCategory: filters.employees[0] as CompanySizeEnum }
        : {}),
      ...(filters.status.length
        ? { companyStatus: filters.status as CompanyReportStatusEnum[] }
        : {}),
      ...(filters.registerStatus.length
        ? { status: filters.registerStatus as CompanyStatusEnum[] }
        : {}),
      ...(filters.expires.length
        ? { expiresWithin: filters.expires as CompanyExpiryFilterEnum[] }
        : {}),
      ...(filters.flags.includes('fines') ? { finesStarted: true } : {}),
      ...(filters.flags.includes('overdue') ? { overdue: true } : {}),
      ...(filters.flags.includes('quarantined') ? { quarantined: true } : {}),
      ...(filters.visibility.includes('notObliged')
        ? { includeNotObliged: true }
        : {}),
      ...(filters.visibility.includes('inactive')
        ? { includeInactive: true }
        : {}),
      ...(filters.isatCategoryCode.length
        ? { isatCategoryCode: filters.isatCategoryCode }
        : {}),
      ...(filters.isatSection.length
        ? { isatSection: filters.isatSection }
        : {}),
      ...(filters.sector.length
        ? { sector: filters.sector as CompanySectorEnum[] }
        : {}),
      ...(filters.regionCode.length ? { regionCode: filters.regionCode } : {}),
      ...(filters.postcode.length ? { postcode: filters.postcode } : {}),
    }),
    [],
  )

  const toReportQuery = useCallback(
    (
      filters: ReportFilters,
      dates: ReportDateRanges,
      q: string,
    ): Record<string, unknown> => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(filters.type.length ? { type: filters.type } : {}),
      ...(filters.status.length ? { status: filters.status } : {}),
      ...(filters.communicationStatus.length
        ? { communicationStatus: filters.communicationStatus }
        : {}),
      ...(filters.equalitySource.length
        ? { equalitySource: filters.equalitySource }
        : {}),
      ...(filters.employees.length
        ? { employeeCountCategory: filters.employees }
        : {}),
      ...(filters.sector.length ? { sector: filters.sector } : {}),
      ...(filters.isatSection.length
        ? { isatSection: filters.isatSection }
        : {}),
      ...(filters.isatCategoryCode.length
        ? { isatCategoryCode: filters.isatCategoryCode }
        : {}),
      ...(filters.regionCode.length ? { regionCode: filters.regionCode } : {}),
      ...(filters.postcode.length ? { postcode: filters.postcode } : {}),
      // The API takes ISO datetimes; the pickers give local Dates.
      ...Object.fromEntries(
        Object.entries(dates)
          .filter(([, value]) => value instanceof Date)
          .map(([key, value]) => [key, (value as Date).toISOString()]),
      ),
    }),
    [],
  )

  const isCompanies = dataset === 'companies'

  const { data, isFetching, isError } = useQuery(
    trpc.company.list.queryOptions(
      { ...(submitted ?? {}), page, pageSize: PAGE_SIZE },
      {
        // Nothing is fetched until the admin asks for it.
        enabled: submitted !== null && isCompanies,
        placeholderData: (prev) => prev,
      },
    ),
  )

  const {
    data: reportData,
    isFetching: isFetchingReports,
    isError: isReportError,
  } = useQuery(
    trpc.reports.list.queryOptions(
      { ...(submitted ?? {}), page, pageSize: PAGE_SIZE },
      {
        enabled: submitted !== null && !isCompanies,
        placeholderData: (prev) => prev,
      },
    ),
  )

  const handleFiltersChange = (key: keyof CompanyFilters, val: string[]) => {
    if (key === 'regionCode') {
      // Region narrows the postcode options; drop any postcode that would now
      // contradict the region.
      setDraft((prev) => ({ ...prev, regionCode: val, postcode: [] }))
      return
    }
    setDraft((prev) => ({ ...prev, [key]: val }))
  }

  const handleReportFiltersChange = (
    key: keyof ReportFilters,
    val: string[],
  ) => {
    if (key === 'regionCode') {
      setReportDraft((prev) => ({ ...prev, regionCode: val, postcode: [] }))
      return
    }
    setReportDraft((prev) => ({ ...prev, [key]: val }))
  }

  const handleDateChange = (key: ReportDateKey, value: Date | undefined) => {
    setReportDates((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    setPage(1)
    setSubmitted(
      isCompanies
        ? toServerQuery(draft, query)
        : toReportQuery(reportDraft, reportDates, query),
    )
    // Deferred to the paint after the results render, otherwise focus moves to
    // a heading that still says "choose your filters".
    requestAnimationFrame(() => resultsRef.current?.focus())
  }

  const handleReset = () => {
    setDraft(EMPTY_FILTERS)
    setReportDraft(EMPTY_REPORT_FILTERS)
    setReportDates({})
    setQuery('')
    setSubmitted(null)
    setPage(1)
  }

  const rows = data?.companies ?? []
  const reportRows = reportData?.reports ?? []
  const paging = isCompanies ? data?.paging : reportData?.paging
  const total = paging?.totalItems ?? 0
  const fetching = isCompanies ? isFetching : isFetchingReports
  const errored = isCompanies ? isError : isReportError

  /**
   * The export link carries the SUBMITTED filter and no paging — the file is
   * the whole matching set, not the page on screen. Rendered as an `<a>` rather
   * than a fetch so the browser owns the download.
   */
  const exportHref = useMemo(() => {
    if (!submitted) return null

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(submitted)) {
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, String(item))
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    }

    // Reaches the workbook's "Um útdráttinn" sheet, so the file records the
    // filter in the same words the admin saw on screen.
    const summary = isCompanies
      ? buildFilterSummary(draft, query)
      : buildReportFilterSummary(reportDraft, reportDates, query)
    for (const line of summary) {
      params.append('filterSummary', line)
    }

    return `/api/export/${dataset}?${params.toString()}`
  }, [
    submitted,
    dataset,
    isCompanies,
    draft,
    reportDraft,
    reportDates,
    query,
  ])

  return (
    <GridContainer>
      <Stack space={3}>
        <Tabs
          label={dataExportText.datasetLabel}
          selected={dataset}
          onChange={(id) => {
            setDataset(id as Dataset)
            // A filter built for one dataset does not mean the same thing in
            // the other, and stale results under a new heading would read as
            // though they belonged to it.
            setSubmitted(null)
            setPage(1)
          }}
          tabs={[
            {
              id: 'companies',
              label: dataExportText.datasetCompanies,
              content: null,
            },
            {
              id: 'reports',
              label: dataExportText.datasetReports,
              content: null,
            },
          ]}
          contentBackground="blue100"
        />

        <GridRow>
          <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
            <Stack space={2}>
              {isCompanies ? (
                <CompanyFilter
                  query={query}
                  onQueryChange={setQuery}
                  filters={draft}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleReset}
                  regionOptions={regionOptions}
                  postcodeOptions={postcodeOptions}
                />
              ) : (
                <ReportExportFilter
                  query={query}
                  onQueryChange={setQuery}
                  filters={reportDraft}
                  onFiltersChange={handleReportFiltersChange}
                  dates={reportDates}
                  onDateChange={handleDateChange}
                  onReset={handleReset}
                  regionOptions={regionOptions}
                  postcodeOptions={postcodeOptions}
                />
              )}
              <Button
                icon="search"
                iconType="outline"
                onClick={handleSubmit}
                loading={fetching}
                size="small"
                fluid
              >
                {dataExportText.submit}
              </Button>
            </Stack>
          </GridColumn>

          <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
            <Stack space={2}>
              {/*
                `tabIndex={-1}` so the post-fetch focus move has somewhere to
                land; `aria-live` so the count is announced rather than only
                drawn. Both halves are needed — a sighted keyboard user gets
                the focus, a screen-reader user gets the message.
              */}
              <Box
                ref={resultsRef}
                tabIndex={-1}
                aria-live="polite"
                aria-busy={fetching}
                outline="none"
              >
                {submitted === null ? (
                  <Stack space={1}>
                    <Text variant="h4">{dataExportText.initialHeading}</Text>
                    <Text>{dataExportText.initialDescription}</Text>
                  </Stack>
                ) : (
                  <Inline space={2} alignY="center" justifyContent="spaceBetween">
                    <Text variant="h4">
                      {fetching
                        ? dataExportText.searching
                        : dataExportText.resultCount(total)}
                    </Text>
                    {exportHref && total > 0 && (
                      <a href={exportHref} download>
                        <Button
                          icon="download"
                          iconType="outline"
                          size="small"
                          variant="utility"
                          colorScheme="white"
                          as="span"
                        >
                          {dataExportText.export}
                        </Button>
                      </a>
                    )}
                  </Inline>
                )}
              </Box>

              {errored && (
                <AlertMessage
                  type="error"
                  title={serverErrorText.title}
                  message={serverErrorText.message}
                />
              )}

              {submitted !== null && total === 0 && !fetching && !errored && (
                <AlertMessage
                  type="info"
                  title={dataExportText.emptyHeading}
                  message={dataExportText.emptyDescription}
                />
              )}

              {submitted !== null &&
                paging &&
                total > 0 &&
                (isCompanies ? (
                  <CompanyTable
                    rows={rows}
                    paging={paging}
                    onPageChange={setPage}
                  />
                ) : (
                  <ReportExportTable
                    rows={reportRows}
                    paging={paging}
                    onPageChange={setPage}
                  />
                ))}
            </Stack>
            {isTablet && <Box paddingTop={2} />}
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}
