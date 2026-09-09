'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import {
  CompanyFilter,
  type CompanyFilters,
} from '../../components/companies/CompanyFilter'
import { CompanyImportModal } from '../../components/companies/CompanyImportModal'
import { CompanyTable } from '../../components/companies/CompanyTable'
import { CreateCompanyModal } from '../../components/companies/CreateCompanyModal'
import { SendCompanyEmailModal } from '../../components/companies/SendCompanyEmailModal'
import {
  CompanyExpiryFilterEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

export const CompaniesContainer = () => {
  const { isTablet } = useIsTablet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  /**
   * The filter the email modal is addressed by, captured when it is opened.
   *
   * ⚠️ Held here rather than read live inside the modal, and non-null is what
   * "open" means. An admin who changes the filter behind the modal must not
   * thereby change who the message they are about to confirm goes to — and the
   * modal itself cannot capture it on mount, because it is always mounted (see
   * the note at its mount site below).
   */
  const [emailFilter, setEmailFilter] = useState<Record<
    string,
    unknown
  > | null>(null)

  const { data, isError, filter, setFilter, resetFilter, recipientFilter } =
    useCompanies({ pageSize: 10 })

  const [filters, setFilters] = useState<CompanyFilters>({
    employees: filter.employeeCountCategory
      ? [filter.employeeCountCategory]
      : [],
    status: (filter.companyStatus ?? []) as CompanyReportStatusEnum[],
    registerStatus: (filter.status ?? []) as CompanyStatusEnum[],
    expires: (filter.expiresWithin ?? []) as CompanyExpiryFilterEnum[],
    flags: [
      ...(filter.finesStarted ? ['fines'] : []),
      ...(filter.overdue ? ['overdue'] : []),
      ...(filter.quarantined ? ['quarantined'] : []),
    ],
    regionCode: filter.regionCode ?? [],
    postcode: filter.postcode ?? [],
    isatCategoryCode: filter.isatCategoryCode ?? [],
    isatSection: filter.isatSection ?? [],
    sector: (filter.sector ?? []) as CompanySectorEnum[],
  })

  const trpc = useTRPC()

  const { data: regionsData } = useQuery(
    trpc.location.regions.queryOptions(undefined, {
      staleTime: 60 * 60_000,
    }),
  )

  // Postcodes are narrowed to the selected region(s) — refetched whenever the
  // region selection changes, so the postcode options only ever show postcodes
  // that belong to the chosen region.
  const { data: postcodesData } = useQuery(
    trpc.location.postcodes.queryOptions(
      {
        regionCode: filters.regionCode.length ? filters.regionCode : undefined,
      },
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

  const sorting = filter.sortBy
    ? [{ id: filter.sortBy, desc: filter.direction === 'desc' }]
    : []

  const handleSortingChange = (next: { id: string; desc: boolean }[]) => {
    if (next.length === 0) {
      setFilter({ sortBy: 'name', direction: 'asc', page: 1 })
      return
    }
    const { id, desc } = next[0]
    setFilter({
      sortBy: id as 'name' | 'employeeCount',
      direction: desc ? 'desc' : 'asc',
      page: 1,
    })
  }

  const handleFiltersChange = (key: keyof CompanyFilters, val: string[]) => {
    if (key === 'regionCode') {
      // Region narrows the postcode options; clear the postcode selection so a
      // postcode outside the chosen region can't linger and contradict it.
      setFilters((prev) => ({ ...prev, regionCode: val, postcode: [] }))
      setFilter({ regionCode: val, postcode: null, page: 1 })
      return
    }

    setFilters((prev) => ({ ...prev, [key]: val }))
    if (key === 'status') {
      setFilter({ companyStatus: val as CompanyReportStatusEnum[], page: 1 })
    } else if (key === 'registerStatus') {
      // Empty selection clears the param rather than sending both values —
      // same result, but an unfiltered URL stays unfiltered.
      setFilter({
        status: val.length ? (val as CompanyStatusEnum[]) : null,
        page: 1,
      })
    } else if (key === 'employees') {
      // API supports a single employeeCountCategory; pass first selected value.
      // Multi-select >1 categories would require an API change.
      setFilter({
        employeeCountCategory: (val[0] ?? null) as CompanySizeEnum | null,
        page: 1,
      })
    } else if (key === 'expires') {
      setFilter({ expiresWithin: val as CompanyExpiryFilterEnum[], page: 1 })
    } else if (key === 'flags') {
      // Combined multi-select; each value maps to its own boolean server param.
      setFilter({
        finesStarted: val.includes('fines') ? true : null,
        overdue: val.includes('overdue') ? true : null,
        quarantined: val.includes('quarantined') ? true : null,
        page: 1,
      })
    } else if (key === 'postcode') {
      setFilter({ postcode: val, page: 1 })
    } else if (key === 'isatCategoryCode') {
      setFilter({ isatCategoryCode: val, page: 1 })
    } else if (key === 'isatSection') {
      setFilter({ isatSection: val, page: 1 })
    } else if (key === 'sector') {
      setFilter({ sector: val as CompanySectorEnum[], page: 1 })
    } else {
      setFilter({ page: 1 })
    }
  }

  const handleReset = () => {
    resetFilter()
    setFilters({
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
    })
  }

  // All filtering (incl. daily fines + overdue) is server-side via useCompanies.
  const rows = data?.companies ?? []

  /*
   * Every company the filter matches, not the page on screen — the send is
   * addressed by the filter, so this is the number that describes it.
   *
   * ⚠️ It can exceed the count the confirmation step then shows: companies with
   * no address on file, and quarantined ones, are excluded there. That step
   * lists them with the reason rather than leaving the drop unexplained.
   */
  const matchCount = data?.paging?.totalItems ?? 0

  const newButton = (
    <Box display="flex" flexDirection="column" rowGap={1} marginTop={2}>
      <Button
        icon="add"
        iconType="outline"
        onClick={() => setIsModalOpen(true)}
        size="small"
        variant="utility"
        colorScheme="white"
        fluid
      >
        Nýtt fyrirtæki
      </Button>
      <Button
        icon="upload"
        iconType="outline"
        onClick={() => setIsImportOpen(true)}
        size="small"
        variant="utility"
        colorScheme="white"
        fluid
      >
        {companiesText.importModal.button}
      </Button>
      <Button
        icon="mail"
        iconType="outline"
        onClick={() => setEmailFilter(recipientFilter)}
        size="small"
        variant="utility"
        colorScheme="white"
        disabled={matchCount === 0}
        fluid
      >
        {`${companiesText.sendEmail.listButton} (${matchCount})`}
      </Button>
    </Box>
  )
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          <CompanyFilter
            query={filter.q ?? ''}
            onQueryChange={(val) => setFilter({ q: val, page: 1 })}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            regionOptions={regionOptions}
            postcodeOptions={postcodeOptions}
          />
          {!isTablet && newButton}
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          {isError && (
            <Box marginBottom={3}>
              <AlertMessage
                type="error"
                title={serverErrorText.title}
                message={serverErrorText.message}
              />
            </Box>
          )}
          {data?.paging && (
            <CompanyTable
              rows={rows}
              paging={data.paging}
              onPageChange={(p) => setFilter({ page: p })}
              sorting={sorting}
              onSortingChange={handleSortingChange}
            />
          )}
          {isTablet && newButton}
        </GridColumn>
      </GridRow>
      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <CompanyImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
      {/*
        ⚠️ Always mounted and toggled through `isOpen`, like every other modal
        here — NOT conditionally mounted.

        `ModalBase` opens the reakit dialog from an effect that runs on mount
        when `isVisible` is already true. The click that mounted it is still in
        flight while `hideOnClickOutside` arms, so reakit reads that same click
        as an outside click and hides it again: the modal flickers and never
        opens. Toggling an already-mounted dialog has no such race.

        The filter snapshot that conditional mounting was buying is taken in
        `emailFilter` instead, at the moment the button is clicked.
      */}
      <SendCompanyEmailModal
        isOpen={emailFilter !== null}
        onClose={() => setEmailFilter(null)}
        target={{ mode: 'filter', filter: emailFilter ?? {} }}
      />
    </GridContainer>
  )
}
