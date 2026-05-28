'use client'

import { useMemo, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import {
  CompanyFilter,
  type CompanyFilters,
} from '../../components/companies/CompanyFilter'
import {
  computeMaxExpiryCutoff,
  normalizeId,
  toDateString,
} from '../../components/companies/companyStatus'
import { CompanyTable } from '../../components/companies/CompanyTable'
import { CreateCompanyModal } from '../../components/companies/CreateCompanyModal'
import { CompanySizeEnum, CompanyStatusFilterEnum, ReportStatusEnum } from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { useReports } from '../../hooks/useReports'

export const CompaniesContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, filter, setFilter, resetFilter } = useCompanies({
    pageSize: 10,
    sortBy: 'name',
    direction: 'asc',
  })

  const [filters, setFilters] = useState<CompanyFilters>({
    employees: filter.employeeCountCategory ? [filter.employeeCountCategory] : [],
    status: (filter.companyStatus ?? []) as CompanyStatusFilterEnum[],
    expires: [],
    dailyFines: [],
  })

  // NOTE: useReports merges as { ...fixedQuery, ...activeFilter } so URL state can override
  // validUntilFrom/validUntilTo. This is safe because these params are not present in the
  // companies page URL — they are only set here via fixedQuery.
  const reportsFixedQuery = useMemo(() => {
    const base = {
      status: [ReportStatusEnum.APPROVED],
      pageSize: 500,
    }
    if (!filters.expires.length) return base
    const now = new Date()
    const maxCutoff = computeMaxExpiryCutoff(filters.expires, now)
    return {
      ...base,
      validUntilFrom: toDateString(now),
      validUntilTo: toDateString(maxCutoff),
    }
  }, [filters.expires])

  const { data: reportsData } = useReports(reportsFixedQuery)
  const approvedReports = reportsData?.reports ?? []

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
    setFilters((prev) => ({ ...prev, [key]: val }))
    if (key === 'status') {
      setFilter({ companyStatus: val as CompanyStatusFilterEnum[], page: 1 })
    } else if (key === 'employees') {
      // API supports a single employeeCountCategory; pass first selected value.
      // Multi-select >1 categories would require an API change.
      setFilter({
        employeeCountCategory: (val[0] ?? null) as CompanySizeEnum | null,
        page: 1,
      })
    } else {
      setFilter({ page: 1 })
    }
  }

  const handleReset = () => {
    resetFilter()
    setFilters({ employees: [], status: [], expires: [], dailyFines: [] })
  }

  const rows = useMemo(() => {
    const companies = data?.companies ?? []

    return companies.filter((company) => {
      // employees: filtered server-side via useCompanies (employeeCountCategory URL param)
      // status: filtered server-side via useCompanies (companyStatus URL param)

      if (filters.expires.length) {
        // Server already filtered approvedReports to the expiry window —
        // just check membership by nationalId.
        const companyId = normalizeId(company.nationalId)
        const hasExpiringReport = approvedReports.some(
          (r) => normalizeId(r.companyNationalId) === companyId,
        )
        if (!hasExpiringReport) return false
      }

      // TODO: daily fines requires finesStartedAt on the list endpoint
      if (filters.dailyFines.length) return false

      return true
    })
  }, [data, approvedReports, filters])

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <CompanyFilter
            query={filter.q ?? ''}
            onQueryChange={(val) => setFilter({ q: val, page: 1 })}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
          />
          <Box display="flex" marginTop={2}>
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
          </Box>
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
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
        </GridColumn>
      </GridRow>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </GridContainer>
  )
}
