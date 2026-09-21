'use client'

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
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  CompanyFilter,
  type CompanyFilters,
} from '../../components/companies/CompanyFilter'
import { CompanyTable } from '../../components/companies/CompanyTable'
import {
  EMPTY_GAP_BOUNDS,
  EMPTY_REPORT_CRITERIA,
  type ReportCriteria,
  reportCriteriaCards,
  type ReportDateKey,
  type ReportDateRanges,
  type ReportGapBounds,
  type ReportGapKey,
} from '../../components/data-export/ReportCriteriaCards'
import {
  CompanyExpiryFilterEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../gen/fetch'
import { dataExportText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import * as styles from './DataExportContainer.css'
import { buildFilterSummary } from './filterSummary'

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
 * ONE dataset: companies. The report criteria in the panel NARROW that list
 * rather than switching it — a company comes back when at least one of its
 * approved filings matches — so every row is a company and the file carries
 * the company columns. A second list of filings was one more thing to
 * reconcile against this one.
 *
 * Unlike the register and the vinnslusvæði, this screen does NOT query as you
 * type. Nothing is fetched until "Sækja lista" is pressed, because the point of
 * the page is to narrow a large list before asking for it, and a table that
 * reshuffles under every keystroke invites exporting the wrong thing.
 *
 * The consequence to keep in mind when editing: what the table shows and what
 * the export contains are BOTH the submitted filter, never the one currently
 * typed into the panel. `submitted` is that snapshot.
 */
export const DataExportContainer = () => {
  const trpc = useTRPC()

  const [draft, setDraft] = useState<CompanyFilters>(EMPTY_FILTERS)
  const [criteria, setCriteria] = useState<ReportCriteria>(
    EMPTY_REPORT_CRITERIA,
  )
  const [dates, setDates] = useState<ReportDateRanges>({})
  const [gaps, setGaps] = useState<ReportGapBounds>(EMPTY_GAP_BOUNDS)
  const [query, setQuery] = useState('')

  /**
   * The filter the results and the export are both built from — null until the
   * admin has asked for something.
   *
   * Deliberately a snapshot rather than a read of the drafts: it is what makes
   * the export match the table. Editing the panel afterwards changes neither
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
    (
      filters: CompanyFilters,
      reportCriteria: ReportCriteria,
      reportDates: ReportDateRanges,
      reportGaps: ReportGapBounds,
      q: string,
    ): Record<string, unknown> => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(filters.employees.length
        ? { employeeCountCategory: filters.employees as CompanySizeEnum[] }
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
      ...(filters.flags.includes('neverSubmitted')
        ? { neverSubmitted: true }
        : {}),
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

      // --- Report criteria: narrow the companies, never change the row. ---
      ...(reportCriteria.type.length
        ? { reportType: reportCriteria.type }
        : {}),
      ...(reportCriteria.companyAdminGender.length
        ? { reportCompanyAdminGender: reportCriteria.companyAdminGender }
        : {}),
      ...(reportCriteria.equalitySource.length
        ? { reportEqualitySource: reportCriteria.equalitySource }
        : {}),
      // Both selected means both states, which is the same as no constraint —
      // so it is sent as none rather than as a contradiction.
      ...(reportCriteria.improvementPlan.length === 1
        ? {
            reportHasImprovementPlan:
              reportCriteria.improvementPlan[0] === 'yes',
          }
        : {}),
      // The API takes ISO datetimes; the pickers give local Dates.
      ...Object.fromEntries(
        Object.entries(reportDates)
          .filter(([, value]) => value instanceof Date)
          .map(([key, value]) => [key, (value as Date).toISOString()]),
      ),
      // The gap selects carry strings. `Number('')` is 0, which would read as
      // a real lower bound of zero, so an empty value is dropped rather than
      // converted.
      ...Object.fromEntries(
        Object.entries(reportGaps)
          .filter(([, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, Number(value)]),
      ),
    }),
    [],
  )

  const { data, isFetching, isError } = useQuery(
    trpc.company.list.queryOptions(
      { ...(submitted ?? {}), page, pageSize: PAGE_SIZE },
      {
        // Nothing is fetched until the admin asks for it.
        enabled: submitted !== null,
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

  const handleCriteriaChange = (key: keyof ReportCriteria, val: string[]) => {
    setCriteria((prev) => ({ ...prev, [key]: val }))
  }

  const handleDateChange = (key: ReportDateKey, value: Date | undefined) => {
    setDates((prev) => ({ ...prev, [key]: value }))
  }

  const handleGapChange = (key: ReportGapKey, value: string | undefined) => {
    setGaps((prev) => {
      const next = { ...prev, [key]: value }

      // Clearing a lower bound clears its upper one too: "up to 4%" with no
      // floor is a different question from the range that was being built, and
      // silently keeping half of it would answer it without being asked.
      if (key === 'reportRawGapPercentFrom' && !value) {
        next.reportRawGapPercentTo = undefined
      }
      if (key === 'reportOskyrtPercentFrom' && !value) {
        next.reportOskyrtPercentTo = undefined
      }

      return next
    })
  }

  const handleSubmit = () => {
    setPage(1)
    setSubmitted(toServerQuery(draft, criteria, dates, gaps, query))
    // Deferred to the paint after the results render, otherwise focus moves to
    // a heading that still says "choose your filters".
    requestAnimationFrame(() => resultsRef.current?.focus())
  }

  const handleReset = () => {
    setDraft(EMPTY_FILTERS)
    setCriteria(EMPTY_REPORT_CRITERIA)
    setDates({})
    setGaps(EMPTY_GAP_BOUNDS)
    setQuery('')
    setSubmitted(null)
    setPage(1)
  }

  const rows = data?.companies ?? []
  const total = data?.paging?.totalItems ?? 0

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
    for (const line of buildFilterSummary(
      draft,
      criteria,
      dates,
      gaps,
      query,
    )) {
      params.append('filterSummary', line)
    }

    return `/api/export/companies?${params.toString()}`
  }, [submitted, draft, criteria, dates, gaps, query])

  return (
    <GridContainer>
      <GridRow>
        {/*
          No `Stack` around these two. A sticky element can only travel inside
          its PARENT's box, and a Stack item wrapper is exactly as tall as the
          button — so wrapped, it had nowhere to move and never stuck. As a
          direct child of the GridColumn, which stretches to the row height, it
          has the whole column to travel. Spacing comes from `submitBar`'s own
          padding instead.
        */}
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          <CompanyFilter
            query={query}
            onQueryChange={setQuery}
            filters={draft}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            regionOptions={regionOptions}
            postcodeOptions={postcodeOptions}
          >
            {/*
              Called, not rendered as `<ReportCriteriaCards />`. The cards have
              to reach `Accordion` as an ARRAY so its `Stack` gives each one its
              own slot — a component element is one child, and all three would
              share a single slot without the divider and spacing the company
              cards above get.
            */}
            {reportCriteriaCards({
              criteria,
              onCriteriaChange: handleCriteriaChange,
              dates,
              onDateChange: handleDateChange,
              gaps,
              onGapChange: handleGapChange,
            })}
          </CompanyFilter>
          <Box className={styles.submitBar}>
            <Button
              icon="search"
              iconType="outline"
              onClick={handleSubmit}
              loading={isFetching}
              size="small"
              fluid
            >
              {dataExportText.submit}
            </Button>
          </Box>
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          <Stack space={2}>
            {/*
              `tabIndex={-1}` so the post-fetch focus move has somewhere to
              land; `aria-live` so the count is announced rather than only
              drawn. Both halves are needed — a sighted keyboard user gets the
              focus, a screen-reader user gets the message.
            */}
            <Box
              ref={resultsRef}
              tabIndex={-1}
              aria-live="polite"
              aria-busy={isFetching}
              outline="none"
            >
              {submitted === null ? (
                <Stack space={1}>
                  <Text variant="h4">{dataExportText.initialHeading}</Text>
                  <Text>{dataExportText.initialDescription}</Text>
                </Stack>
              ) : (
                <Inline space={2} alignY="center" justifyContent="spaceBetween">
                  {/*
                    The only count on the screen — `CompanyTable`'s own is
                    suppressed below. It lives here rather than there because
                    it sits beside the download button, which is the moment it
                    matters: nobody should download 1.500 rows expecting 60.
                    This is also the `aria-live` region, so the same text is
                    what a screen reader is told when a search completes.
                  */}
                  <Text variant="h4">
                    {isFetching
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

            {isError && (
              <AlertMessage
                type="error"
                title={serverErrorText.title}
                message={serverErrorText.message}
              />
            )}

            {submitted !== null && total === 0 && !isFetching && !isError && (
              <AlertMessage
                type="info"
                title={dataExportText.emptyHeading}
                message={dataExportText.emptyDescription}
              />
            )}

            {submitted !== null && data?.paging && total > 0 && (
              <CompanyTable
                rows={rows}
                paging={data.paging}
                onPageChange={setPage}
                showResultCount={false}
              />
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
