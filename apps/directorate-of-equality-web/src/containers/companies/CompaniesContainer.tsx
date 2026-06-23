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
import {
  CompanyExpiryFilterEnum,
  CompanyReportStatusEnum,
  CompanySizeEnum,
  ReportStatusEnum,
} from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

export const CompaniesContainer = () => {
  const { isTablet } = useIsTablet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const { data, isError, filter, setFilter, resetFilter } = useCompanies({
    pageSize: 10,
  })

  const [filters, setFilters] = useState<CompanyFilters>({
    employees: filter.employeeCountCategory
      ? [filter.employeeCountCategory]
      : [],
    status: (filter.companyStatus ?? []) as CompanyReportStatusEnum[],
    expires: (filter.expiresWithin ?? []) as CompanyExpiryFilterEnum[],
    dailyFines: [],
    regionCode: filter.regionCode ?? [],
    postcode: filter.postcode ?? [],
    isatCategoryCode: filter.isatCategoryCode ?? [],
  })

  const trpc = useTRPC()
  const { data: reportsData } = useQuery(
    trpc.reports.list.queryOptions({
      status: [ReportStatusEnum.APPROVED],
      pageSize: 500,
    }),
  )
  const approvedReports = reportsData?.reports ?? []

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
    } else if (key === 'employees') {
      // API supports a single employeeCountCategory; pass first selected value.
      // Multi-select >1 categories would require an API change.
      setFilter({
        employeeCountCategory: (val[0] ?? null) as CompanySizeEnum | null,
        page: 1,
      })
    } else if (key === 'expires') {
      setFilter({ expiresWithin: val as CompanyExpiryFilterEnum[], page: 1 })
    } else if (key === 'postcode') {
      setFilter({ postcode: val, page: 1 })
    } else if (key === 'isatCategoryCode') {
      setFilter({ isatCategoryCode: val, page: 1 })
    } else {
      setFilter({ page: 1 })
    }
  }

  const handleReset = () => {
    resetFilter()
    setFilters({
      employees: [],
      status: [],
      expires: [],
      dailyFines: [],
      regionCode: [],
      postcode: [],
      isatCategoryCode: [],
    })
  }

  const rows = useMemo(() => {
    const companies = data?.companies ?? []

    return companies.filter(() => {
      // employees: filtered server-side via useCompanies (employeeCountCategory URL param)
      // status:    filtered server-side via useCompanies (companyStatus URL param)
      // expires:   filtered server-side via useCompanies (expiresWithin URL param)

      // TODO: daily fines requires finesStartedAt on the list endpoint
      if (filters.dailyFines.length) return false

      return true
    })
  }, [data, filters.dailyFines])

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
              approvedReports={approvedReports}
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
    </GridContainer>
  )
}
